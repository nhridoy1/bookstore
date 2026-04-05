import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Shield, BookOpen } from "lucide-react";

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [role, setRole] = useState<string>("admin");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "assign">("signup");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (data.user) {
      toast({ title: "Account created!", description: "Now assign your role." });
      setStep("assign");
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-role", {
        body: { user_id: currentUser.id, role, secret_code: secretCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Success!", description: `${role} role assigned. Redirecting...` });
      setTimeout(() => {
        window.location.href = role === "admin" ? "/admin" : "/publisher";
      }, 1500);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  // If user is already logged in, go straight to role assignment
  const showAssign = step === "assign" || !!user;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="font-heading text-2xl">Admin / Publisher Signup</CardTitle>
            <CardDescription>Create an account and assign your role with a secret code</CardDescription>
          </CardHeader>
          <CardContent>
            {!showAssign ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" className="text-primary underline" onClick={() => navigate("/auth")}>
                    Sign in first
                  </button>, then come back here.
                </p>
              </form>
            ) : (
              <form onSubmit={handleAssignRole} className="space-y-4">
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground text-center">
                  Signed in as: <strong className="text-foreground">{user?.email}</strong>
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="publisher">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> Publisher
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="secret">Secret Code</Label>
                  <Input
                    id="secret"
                    type="password"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    required
                    placeholder="Enter admin secret code"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact the system administrator for the secret code.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Assigning role..." : `Become ${role}`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
