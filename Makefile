.PHONY: test

test:
	deno run --allow-net serve_test.ts
	deno run --allow-net --allow-read static_test.ts
	deno run --allow-net redirect_test.ts
