
github-page:
	@ mkdir -p docs/
	@ rm -rf docs/*
	@ ./bin/dodomark asset/ docs/ -theme markdeep
