import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TypographyH2 } from "@/components/ui/typography";
import {
	type TestFixture,
	TestFixtureSchema,
	TestSnapshotSchema,
} from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

export const Route = createFileRoute("/tests/$test")({
	component: TestFixtureDetailContainer,
});

function TabContent({
	includeViolationValues,
	value,
	form,
}: {
	includeViolationValues: boolean[];
	value: string;
	violations: TestFixture["snapshot"]["violations"];
	form: ReturnType<typeof useForm<TestFixture["snapshot"]>>;
}) {
	const violations = useWatch({
		control: form.control,
		name: "violations",
	});
	// Ensure that violations is an object to avoid errors
	const violationKeys = Object.keys(violations || {}).filter((key) =>
		includeViolationValues.includes(violations[key].fail),
	);

	return (
		<TabsContent value={value}>
			<ScrollArea className="h-96">
				<div className="space-y-4">
					{violationKeys.map((violationKey) => (
						<FormField
							key={violationKey}
							control={form.control}
							name={`violations.${violationKey}.fail`}
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>{violationKey}</FormLabel>
										<FormDescription>
											{violations[violationKey].rule}
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
	);
}

function TestFixtureDetail({ testFixture }: { testFixture: TestFixture }) {
	const form = useForm<TestFixture["snapshot"]>({
		resolver: zodResolver(TestSnapshotSchema),
		defaultValues: testFixture.snapshot,
		mode: "onChange",
	});

	function onSubmit(values: TestFixture["snapshot"]) {
		fetch(`http://localhost:8082/tests/${testFixture.file}/update`, {
			method: "POST",
			mode: "cors",
			body: JSON.stringify({
				file: testFixture.file,
				snapshot: values,
			}),
		}).then((d) => console.log(d));
	}

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
						<BreadcrumbPage>{testFixture.file}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
					<div className="flex justify-between border-b">
						<TypographyH2>{testFixture.snapshot.name}</TypographyH2>
						<Button type="submit" disabled={!form.formState.isValid}>
							Save Snapshot
						</Button>
					</div>
					<div>
						<img
							src={testFixture.snapshot.content}
							width={testFixture.snapshot.viewport.width}
							height={testFixture.snapshot.viewport.height}
							className="mx-auto"
							aria-label="Test snapshot"
						/>
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

					<Tabs defaultValue="all" className="space-y-8">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="all">All tests</TabsTrigger>
							<TabsTrigger value="failing">Failing tests</TabsTrigger>
							<TabsTrigger value="passed">Passed tests</TabsTrigger>
						</TabsList>
						<TabContent
							value="all"
							violations={testFixture.snapshot.violations}
							form={form}
							includeViolationValues={[true, false]}
						/>
						<TabContent
							value="failing"
							violations={testFixture.snapshot.violations}
							form={form}
							includeViolationValues={[true]}
						/>
						<TabContent
							value="passed"
							violations={testFixture.snapshot.violations}
							form={form}
							includeViolationValues={[false]}
						/>
					</Tabs>
				</form>
			</Form>
		</>
	);
}

function TestFixtureDetailContainer() {
	const [testFixture, setTestFixture] = useState<TestFixture>();
	const { test } = Route.useParams();
	useEffect(() => {
		fetch(`http://localhost:8082/tests/${test}`, {
			method: "POST",
			mode: "cors",
		})
			.then((res) => {
				return res.json();
			})
			.then((data) => {
				const {
					success,
					data: parsed,
					error,
				} = TestFixtureSchema.safeParse(data);
				if (!success) {
					console.error(error);
					return;
				}
				setTestFixture(parsed);
			});
	}, [test]);
	if (!testFixture) return null;
	return <TestFixtureDetail testFixture={testFixture} />;
}
