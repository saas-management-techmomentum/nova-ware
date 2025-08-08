import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const vendors = [
  { id: "V-21", name: "SteelWorks", contact: "sales@steelworks.com", products: 58, performance: "A" },
  { id: "V-22", name: "PackPro", contact: "hello@packpro.io", products: 34, performance: "B" },
  { id: "V-23", name: "GloveCo", contact: "support@gloveco.com", products: 12, performance: "A" },
];

const Vendors = () => {
  return (
    <div className="space-y-6">
      <Seo title="Vendors — WMS" description="Vendor contacts and product lists." canonical="/vendors" />
      <h1 className="text-2xl font-semibold">Vendor Database</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.id}</TableCell>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.contact}</TableCell>
                <TableCell>{v.products}</TableCell>
                <TableCell>
                  {v.performance === 'A' ? <Badge>Preferred</Badge> : <Badge variant="secondary">Standard</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Vendors;
