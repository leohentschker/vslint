import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
	".ico": "image/x-icon",
	".html": "text/html",
	".js": "text/javascript",
	".json": "application/json",
	".css": "text/css",
	".png": "image/png",
	".jpg": "image/jpeg",
	".wav": "audio/wav",
	".mp3": "audio/mpeg",
	".svg": "image/svg+xml",
	".pdf": "application/pdf",
	".zip": "application/zip",
	".doc": "application/msword",
	".eot": "application/vnd.ms-fontobject",
	".ttf": "application/x-font-ttf",
};
export const BROWSER_START_COMMANDS: string =
	{
		darwin: "open", // MacOS
		win32: "start", // Windows
		linux: "xdg-open", // Linux,
		cygwin: "xdg-open", // Cygwin
		freebsd: "xdg-open", // FreeBSD
		openbsd: "xdg-open", // OpenBSD
		sunos: "xdg-open", // SunOS
		aix: "xdg-open", // AIX
		android: "xdg-open", // Android
		bsd: "xdg-open", // BSD
		haiku: "xdg-open", // Haiku
		netbsd: "xdg-open", // NetBSD
	}[process.platform] || "open";

const serveStaticAsset = (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	rootDir: string,
) => {
	const url = new URL(req.url || "", `http://${req.headers.host}`);
	let filePath: string;
	if (url.pathname === "/" || url.pathname.endsWith(".tsx")) {
		filePath = path.join(rootDir, "index.html");
	} else {
		filePath = path.join(rootDir, url.pathname);
	}
	if (!fs.existsSync(filePath)) {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("File not found");
		return;
	}
	const fileStream = fs.createReadStream(filePath);
	res.setHeader(
		"Content-Type",
		MIME_TYPES[path.extname(filePath)] || "text/plain",
	);
	fileStream.pipe(res);
	fileStream.on("end", () => {
		res.end();
	});
};
const isFixtureRequest = (req: http.IncomingMessage) => {
	return req.method === "POST";
};
const isTestAssetRequest = (req: http.IncomingMessage) => {
	const url = new URL(req.url || "", `http://${req.headers.host}`);
	return url.pathname.includes("/test-fixtures/");
};
const isStaticAssetRequest = (req: http.IncomingMessage) => {
	const url = new URL(req.url || "", `http://${req.headers.host}`);
	return (
		url.pathname.startsWith("/tests/") ||
		url.pathname === "/" ||
		url.pathname.startsWith("/assets")
	);
};
const getFixtureDataForFilePath = (filePath: string) => {
	const fileStats = fs.statSync(filePath);
	const fileData = fs.readFileSync(filePath, "utf8");
	const file = path.basename(filePath);
	return {
		file,
		lastModified: fileStats.mtime.toISOString(),
		snapshot: JSON.parse(fileData),
	};
};
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "OPTIONS, POST, GET",
};
const listFixtures = (
	_req: http.IncomingMessage,
	res: http.ServerResponse,
	testSnapshotDir: string,
) => {
	if (!fs.existsSync(testSnapshotDir)) {
		res.writeHead(404, { "Content-Type": "text/plain", ...CORS_HEADERS });
		res.end("File not found");
		return;
	}
	const fixtureFiles = fs.readdirSync(testSnapshotDir);
	const fixtures = fixtureFiles
		.filter((file) => file.endsWith(".json"))
		.map((file) => {
			return getFixtureDataForFilePath(path.join(testSnapshotDir, file));
		});
	res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
	return res.end(
		JSON.stringify({
			fixtures,
		}),
	);
};
const getFixture = (
	_req: http.IncomingMessage,
	res: http.ServerResponse,
	testSnapshotDir: string,
	fixtureFile: string,
) => {
	const filePath = path.join(testSnapshotDir, fixtureFile);
	if (!fs.existsSync(filePath)) {
		res.writeHead(404, { "Content-Type": "text/plain", ...CORS_HEADERS });
		res.end("File not found");
		return;
	}
	const fixture = getFixtureDataForFilePath(filePath);
	res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
	return res.end(JSON.stringify(fixture));
};
const updateFixture = (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	testSnapshotDir: string,
) => {
	let body = "";
	req.on("data", (chunk) => {
		body += chunk;
	});
	req.on("end", () => {
		const data = JSON.parse(body);
		const filePath = path.join(testSnapshotDir, data.file);
		fs.writeFileSync(filePath, JSON.stringify(data.snapshot, null, 2));
		res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
		res.end(JSON.stringify({ success: true }));
	});
};
const serveFixtureRequest = (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	testSnapshotDir: string,
) => {
	const url = new URL(req.url || "", `http://${req.headers.host}`);
	if (url.pathname === "/tests") {
		return listFixtures(req, res, testSnapshotDir);
	}
	if (url.pathname.endsWith("/update")) {
		return updateFixture(req, res, testSnapshotDir);
	}
	const fixtureFile = path.basename(url.pathname);
	return getFixture(req, res, testSnapshotDir, fixtureFile);
};

export const createVSLintServer = (
	port: number,
	siteDir: string,
	testSnapshotDir: string,
) => {
	let server: http.Server;
	try {
		server = http.createServer(async (req, res) => {
			if (req.method === "OPTIONS") {
				res.writeHead(204, CORS_HEADERS);
				return res.end();
			}
			if (isFixtureRequest(req)) {
				return serveFixtureRequest(req, res, testSnapshotDir);
			}
			if (isTestAssetRequest(req)) {
				return serveStaticAsset(req, res, testSnapshotDir);
			}
			if (isStaticAssetRequest(req)) {
				return serveStaticAsset(req, res, siteDir);
			}
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("Not found");
		});
	} catch (err) {
		console.log(err);
		return;
	}
	server.listen(port);
};

createVSLintServer(
	8082,
	path.join(__dirname, "../vslint-client/dist/"),
	path.join(
		__dirname,
		"../../../../enotice-app/orderDisplaySite/__tests__/__design_snapshots__",
	),
);
