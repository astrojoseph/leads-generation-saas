import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Proxy configuration
const proxy = {
  host: "proxy.toolip.io",
  port: "PORT_NUM_GOES_HERE",
  auth: {
    username: "USERNAME_GOES_HERE",
    password: "PASSWORD_GOES_HERE",
  },
};

// Create an https agent that doesn't verify SSL certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function cleanJsonString(str: string): string {
  str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  str = str.replace(/,\s*([\]}])/g, "$1");
  str = str.replace(/:\s*'([^']*)'/g, ': "$1"');
  return str;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowData = requestCounts.get(ip) || { count: 0, timestamp: now };

  if (now - windowData.timestamp > RATE_LIMIT_WINDOW) {
    windowData.count = 1;
    windowData.timestamp = now;
  } else {
    windowData.count++;
  }

  requestCounts.set(ip, windowData);
  return windowData.count <= MAX_REQUESTS_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const { keyword, siteAddress, location, emailDomain } = await req.json();

    if (!keyword || !siteAddress || !location || !emailDomain) {
      return NextResponse.json(
        {
          error:
            "All fields (keyword, siteAddress, location, emailDomain) are required",
        },
        { status: 400 }
      );
    }

    const searchQuery = `site:${siteAddress} "${keyword}" "${location}" "@${emailDomain}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      searchQuery
    )}&num=100`;

    console.log(`Fetching Google results for query: ${searchQuery}`);
    const response = await axios.get(searchUrl, {
      proxy,
      httpsAgent,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    console.log(`Google response status: ${response.status}`);

    // Check for Google blocking
    if (
      response.data.includes("unusual traffic") ||
      response.data.includes("CAPTCHA")
    ) {
      throw new Error(
        "Google has detected unusual traffic. Please try again later."
      );
    }

    const $ = cheerio.load(response.data);
    const searchResults = $("#main").text();

    const prompt = `I'm attaching cluttered and messy data from a Google search. Please process it and extract information in the following JSON format:
    [
      {
        "Name": "Extracted name or 'N/A' if not found",
        "BusinessName": "Extracted business name or 'N/A' if not found",
        "Email": "Extracted email or 'N/A' if not found",
        "SocialMediaHandleLink": "Extracted social media link or 'N/A' if not found"
      }
    ]
    Only include entries where at least one field is not 'N/A'. Ensure the JSON is properly formatted. Here's the data:

    ${searchResults}`;

    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    let processedData;
    try {
      let jsonString = generatedText.replace(/```json\n|\n```/g, "").trim();
      jsonString = cleanJsonString(jsonString);
      processedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing Gemini API response:", parseError);
      console.log("Raw Gemini API response:", generatedText);
      return NextResponse.json(
        { error: "Failed to parse the generated data. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(processedData)) {
      console.error("Unexpected data format from Gemini API");
      return NextResponse.json(
        { error: "Unexpected data format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("API error:", error);

    // Detailed error logging
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response headers:", error.response?.headers);
    }

    return NextResponse.json(
      { error: "Failed to generate leads. Error: " + error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Test the proxy on health check
    const response = await axios.get("http://httpbin.org/ip", {
      proxy,
      httpsAgent,
      timeout: 5000,
    });

    return NextResponse.json({
      status: "ok",
      proxyIp: response.data.origin,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
