.PHONY: test

test:
	deno serve_test.ts --allow-net
	deno static_test.ts --allow-net --allow-read