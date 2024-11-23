"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save } from "lucide-react";

export default function LeadGeneration() {
  const [keyword, setKeyword] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [location, setLocation] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [results, setResults] = useState([]);
  const [savedLeads, setSavedLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/generate-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, siteAddress, location, emailDomain }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const handleSave = (lead) => {
    setSavedLeads((prevSavedLeads) => [...prevSavedLeads, lead]);
  };

  const LeadTable = ({ leads, showSaveButton = false }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Business Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Social Media Handle Link</TableHead>
          {showSaveButton && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead, index) => (
          <TableRow key={index}>
            <TableCell>{lead.Name}</TableCell>
            <TableCell>{lead.BusinessName}</TableCell>
            <TableCell>{lead.Email}</TableCell>
            <TableCell>{lead.SocialMediaHandleLink}</TableCell>
            {showSaveButton && (
              <TableCell>
                <Button
                  size="sm"
                  onClick={() => handleSave(lead)}
                  disabled={savedLeads.some(
                    (savedLead) => savedLead.Email === lead.Email
                  )}
                >
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Leads</TabsTrigger>
          <TabsTrigger value="saved">Saved Leads</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Lead Generation</CardTitle>
              <CardDescription>Enter details to generate leads</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Main Keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Site Address"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="Email Domain"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Generating Leads..." : "Generate Leads"}
                </Button>
              </form>
            </CardContent>
          </Card>
          {results.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Generated Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadTable leads={results} showSaveButton={true} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="saved">
          <Card>
            <CardHeader>
              <CardTitle>Saved Leads</CardTitle>
              <CardDescription>
                Your saved leads are listed here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedLeads.length > 0 ? (
                <LeadTable leads={savedLeads} />
              ) : (
                <p>No saved leads yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
