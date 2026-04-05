import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, address, country },
      },
    });
    if (!error && data.user) {
      await supabase
        .from("profiles")
        .update({ display_name: fullName, address, country })
        .eq("user_id", data.user.id);
    }
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Please check your email to verify, then login." });
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BookOpen className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
            <CardDescription>Register to start buying and borrowing books</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
              </div>
              <div>
                <Label htmlFor="confirm-password">Re-type Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
              <div>
                <Label htmlFor="address">Present Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Bangladesh" />
              </div>
              <Button type="submit" className="w-full" disabled={loading || (confirmPassword.length > 0 && password !== confirmPassword)}>
                {loading ? "Creating account..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
