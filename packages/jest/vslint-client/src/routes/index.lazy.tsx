import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";

export const description =
	"An products dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. It displays a list of products in a table with actions.";

export const Route = createLazyFileRoute("/")({
	component: Index,
});

const tests: Test[] = [
	{
		violations: {
			"text-too-wide": false,
			"bad-gray-text": false,
		},
		name: "Test 1",
		file: "test.tsx",
		status: "passed",
		contentHash:
			"44275f8ca9597f6bd896c5319e95d85a2e21ddc5b68ed3e994e23ef54388260d",
	},
];

const TestSchema = z.object({
	contentHash: z.string(),
	name: z.string(),
	file: z.string(),
	status: z.enum(["passed", "failed"]),
	violations: z.record(z.string(), z.boolean()),
});
type Test = z.infer<typeof TestSchema>;

function TestsTable({
	tests,
}: {
	tests: Test[];
}) {
	return (
		<>
			<div className="flex justify-between border-b">
				<TypographyH2>Tests</TypographyH2>
				<div className="relative ml-auto flex-1 md:grow-0">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search..."
						className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
					/>
				</div>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>File</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="hidden md:table-cell">Updated at</TableHead>
						<TableHead>
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tests.map((test) => (
						<TableRow key={test.contentHash}>
							<TableCell className="table-cell">{test.name}</TableCell>
							<TableCell>{test.file}</TableCell>
							<TableCell>
								<Badge variant="outline">
									{test.status === "passed" ? "Passed" : "Failed"}
								</Badge>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								2023-07-12 10:42 AM
							</TableCell>
							<TableCell>
								<Link to={`tests/${test.file}`}>
									<Button>View Details</Button>
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
					<TestsTable tests={tests} />
				</Tabs>
			</main>
		</>
	);
}
