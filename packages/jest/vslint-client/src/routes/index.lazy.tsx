import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { TypographyH2 } from "@/components/ui/typography";
import { ListTextFixtureResponseSchema, type TestFixture } from "@/lib/utils";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const description =
	"An products dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. It displays a list of products in a table with actions.";

export const Route = createLazyFileRoute("/")({
	component: Index,
});

function TestsTable({
	testFixtures,
}: {
	testFixtures: TestFixture[];
}) {
	console.log(testFixtures, "TEST FIXTURES");
	return (
		<>
			<div className="flex justify-between border-b">
				<TypographyH2>Tests</TypographyH2>
			</div>
			<Table>
				<TableHeader>
					<TableRow className="text-sm text-muted-foreground font-medium">
						<TableHead className="text-sm text-muted-foreground font-medium">
							Name
						</TableHead>
						<TableHead className="text-sm text-muted-foreground font-medium">
							File
						</TableHead>
						<TableHead className="text-sm text-muted-foreground font-medium hidden md:table-cell">
							Updated at
						</TableHead>
						<TableHead>
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{testFixtures.map((testFixture) => (
						<TableRow key={testFixture.snapshot.contentHash}>
							<TableCell className="table-cell">
								<span className="font-semibold">
									{testFixture.snapshot.name}
								</span>
							</TableCell>
							<TableCell className="w-72">{testFixture.file}</TableCell>
							<TableCell className="hidden md:table-cell">
								{new Date(testFixture.lastModified).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<Link to={`tests/${testFixture.file}`}>
									<Button>Details</Button>
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}

export function Index() {
	const [testFixtures, setTestFixtures] = useState<TestFixture[]>();
	useEffect(() => {
		fetch("http://localhost:8082/tests", { method: "POST", mode: "cors" })
			.then((res) => {
				console.log(res.body, "BODY", res.status, "STATUS", res.statusText);
				return res.json();
			})
			.then((data) => {
				const {
					success,
					data: parsed,
					error,
				} = ListTextFixtureResponseSchema.safeParse(data);
				if (!success) {
					console.error(error);
					return;
				}
				setTestFixtures(parsed.fixtures);
			});
	}, []);
	if (!testFixtures) return null;
	return (
		<>
			<Breadcrumb className="hidden md:flex">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage>Tests</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<main className="grid flex-1 items-start gap-4 sm:py-0 md:gap-8">
				<Tabs defaultValue="all">
					<TestsTable testFixtures={testFixtures} />
				</Tabs>
			</main>
		</>
	);
}
