import type { DesignReviewParams } from "./types";

export const elementIsHTMLElement = (
	element: unknown,
): element is HTMLElement => {
	return typeof element === "object" && element !== null;
};
export const getViewportSize = (
	params?: DesignReviewParams,
): { width: number; height: number } => {
	if (!params?.atSize) {
		return {
			width: 1920,
			height: 1080,
		};
	}
	if (params.atSize === "full-screen") {
		return {
			width: 1920,
			height: 1080,
		};
	}
	if (params.atSize === "mobile") {
		return {
			width: 375,
			height: 812,
		};
	}
	if (params.atSize === "tablet") {
		return {
			width: 768,
			height: 1024,
		};
	}
	if (params.atSize === "sm") {
		return {
			width: 640,
			height: 480,
		};
	}
	if (params.atSize === "md") {
		return {
			width: 768,
			height: 1024,
		};
	}
	if (params.atSize === "lg") {
		return {
			width: 1024,
			height: 768,
		};
	}
	if (params.atSize === "xl") {
		return {
			width: 1280,
			height: 1024,
		};
	}
	if (params.atSize === "2xl") {
		return {
			width: 1536,
			height: 1024,
		};
	}
	if (params.atSize === "3xl") {
		return {
			width: 1920,
			height: 1080,
		};
	}
	return params.atSize;
};