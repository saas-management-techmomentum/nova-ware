import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Integrations = () => {
  return (
    <div className="space-y-6">
      <Seo title="Integrations — WMS" description="Connect to carriers and external APIs." canonical="/integrations" />
      <h1 className="text-2xl font-semibold">Integrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'FedEx', key: 'FEDEX_API_KEY' },
          { name: 'UPS', key: 'UPS_API_KEY' },
          { name: 'DHL', key: 'DHL_API_KEY' },
        ].map((i) => (
          <div key={i.name} className="space-y-2">
            <Label>{i.name} API Key</Label>
            <Input placeholder={`${i.name} API Key`} />
            <div className="flex gap-2">
              <Button onClick={() => toast({ title: `${i.name}`, description: "Connection successful (mock)" })}>Test Connection</Button>
              <Button variant="outline">Save</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
