import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const initial = [
  { id: "EMP-01", name: "Jamie Lee", role: "Admin", email: "jamie@wms.io" },
  { id: "EMP-02", name: "Alex Kim", role: "Warehouse", email: "alex@wms.io" },
  { id: "EMP-03", name: "Morgan Yu", role: "Finance", email: "morgan@wms.io" },
];

const Employees = () => {
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Warehouse");

  const add = () => {
    if (!name || !email) return;
    const newRow = { id: `EMP-${rows.length + 1}`.padEnd(6, '0'), name, role, email } as any;
    setRows([newRow, ...rows]);
    setName("");
    setEmail("");
    toast({ title: "Employee added", description: `${name} added as ${role}` });
  };

  return (
    <div className="space-y-6">
      <Seo title="Employee Management — WMS" description="Manage team members and permissions." canonical="/employees" />
      <h1 className="text-2xl font-semibold">Employee Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Warehouse">Warehouse</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={add}>Add Employee</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.id}</TableCell>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.role}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Edited", description: `${e.name} updated` })}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => setRows(rows.filter((r) => r.id !== e.id))}>Remove</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Employees;
