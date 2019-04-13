.PHONY: test

test:
	deno --allow-net serve_test.ts
	deno --allow-net --allow-read static_test.ts
