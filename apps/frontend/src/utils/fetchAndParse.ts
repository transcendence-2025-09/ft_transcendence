import { z } from "zod";

export async function fetchAndParse<T extends z.ZodTypeAny>(
    url: string,
    schema: T,
    options?: RequestInit,
): Promise<z.infer<T>> {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error("Error: fetchAndParse failed");
    }

    const data = await response.json();
    const safeParseResult = schema.safeParse(data);
    if (!safeParseResult.success) {
        throw new Error("Error: fetchAndParse failed");
    }

    return safeParseResult.data;
}
