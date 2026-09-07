import { Button } from "@codefast/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@codefast/ui/form";
import { Input } from "@codefast/ui/input";
import { useForm } from "react-hook-form";

interface FormUsageValues {
  username: string;
}

export function FormUsage() {
  const form = useForm<FormUsageValues>({ defaultValues: { username: "" } });

  function onSubmit(values: FormUsageValues): void {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="leo-park" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
          rules={{ required: "Username is required." }}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
