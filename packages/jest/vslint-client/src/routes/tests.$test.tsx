import { createFileRoute } from '@tanstack/react-router'
import { zodResolver } from "@hookform/resolvers/zod"
import { useWatch } from "react-hook-form";
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { TypographyH2 } from '@/components/ui/typography'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from '@tanstack/react-router';

const FormSchema = z.object({
  explanation: z.string().optional(),
  contentHash: z.string(),
  violations: z.record(z.string(), z.boolean()),
  pass: z.boolean(),
})

export const Route = createFileRoute('/tests/$test')({
  component: PostComponent,
})

function TabContent({
  includePassValues,
  value,
  form
}: {
  includePassValues: boolean[];
  value: string;
  violations: Record<string, boolean>;
  form: ReturnType<typeof useForm<z.infer<typeof FormSchema>>>
}) {
  const violations = useWatch({
    control: form.control,
    name: "violations",
  });
  // Ensure that violations is an object to avoid errors
  const violationKeys = Object.keys(violations || {}).filter(
    (key) => includePassValues.includes(violations[key])
  );

  return (
    <TabsContent value={value}>
      <ScrollArea className="h-96">
        <div className="space-y-4">
          {violationKeys.map((violationKey) => (
            <FormField
              key={violationKey}
              control={form.control}
              name={`violations.${violationKey}`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{violationKey}</FormLabel>
                    <FormDescription>
                      Receive emails about your account security.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>
      </ScrollArea>
    </TabsContent>
  )
}

function PostComponent() {
  const initialData = {
    violations: {
      "text-too-wide": false,
      "bad-gray-text": true
    },
    pass: true,
    explanation: 'More things to check',
    contentHash: '44275f8ca9597f6bd896c5319e95d85a2e21ddc5b68ed3e994e23ef54388260d',
  };
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof FormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    console.log('WUT');
  }

  // In a component!
  const { test } = Route.useParams();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link to="/">
              <BreadcrumbPage>Tests</BreadcrumbPage>
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{test}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className='flex justify-between border-b'>
            <TypographyH2>{test}</TypographyH2>
            <Button
              type='submit'
              disabled={!form.formState.isValid}
            >
              Save Snapshot
            </Button>
          </div>

          <FormField
            control={form.control}
            name="contentHash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Hash</FormLabel>
                <FormControl>
                  <Input disabled {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Design Review</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Tabs defaultValue="all" className='space-y-8'>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All tests</TabsTrigger>
              <TabsTrigger value="failing">Failing tests</TabsTrigger>
              <TabsTrigger value="passed">Passed tests</TabsTrigger>
            </TabsList>
            <TabContent value="all" violations={initialData.violations} form={form} includePassValues={[true, false]} />
            <TabContent value="failing" violations={initialData.violations} form={form} includePassValues={[false]} />
            <TabContent value="passed" violations={initialData.violations} form={form} includePassValues={[true]} />
          </Tabs>
        </form>
      </Form>
    </>
  )
}
