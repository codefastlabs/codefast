import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@codefast/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@codefast/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@codefast/ui/avatar";
import { Badge } from "@codefast/ui/badge";
import { Kbd, KbdGroup } from "@codefast/ui/kbd";
import { Label } from "@codefast/ui/label";
import { Progress } from "@codefast/ui/progress";
import { Skeleton } from "@codefast/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@codefast/ui/table";

import { DemoSection } from "#/components/demo-section";

export function FeedbackDisplaySection() {
  return (
    <DemoSection description="Status, media, and data-display primitives." title="Feedback & display">
      <div className="space-y-3">
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>You can add components to your app using the CLI.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
        </Alert>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar>
          <AvatarImage alt="@codefast" src="https://github.com/codefastlabs.png" />
          <AvatarFallback>CF</AvatarFallback>
        </Avatar>
        <Avatar size="lg">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>

      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled?</AccordionTrigger>
          <AccordionContent>Yes, it ships with default styles from @codefast/ui.</AccordionContent>
        </AccordionItem>
      </Accordion>

      <Table>
        <TableCaption>A list of recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">INV001</TableCell>
            <TableCell>
              <Badge variant="secondary">Paid</Badge>
            </TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">INV002</TableCell>
            <TableCell>
              <Badge variant="outline">Pending</Badge>
            </TableCell>
            <TableCell className="text-right">$150.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="space-y-2">
        <Label>Upload progress</Label>
        <Progress value={60} />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </DemoSection>
  );
}
