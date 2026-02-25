"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useState } from "react";
import { Settings, User, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-500" />
            <h3 className="font-semibold">Profile</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Full Name" placeholder="Your name" />
          <Input label="Email" type="email" placeholder="your@email.com" />
          <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
          <Button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gray-500" />
            <h3 className="font-semibold">Security</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Current Password" type="password" />
          <Input label="New Password" type="password" />
          <Input label="Confirm New Password" type="password" />
          <Button variant="secondary">Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-gray-500" />
            <h3 className="font-semibold">API Configuration</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Anthropic API Key" type="password" placeholder="sk-ant-..." />
          <p className="text-xs text-gray-400">
            Used for AI-powered invoice extraction. Set in your .env file.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
