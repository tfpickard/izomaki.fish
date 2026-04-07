/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			user: { id: string } | null;
		}
	}
}

export {};
