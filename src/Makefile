

marklit2noweb.awk: marklit-noweb.md
	cat $< | sed -n '/^```awk/,/^```/ p' | sed '1 d; $$ d' > $@
	@ chmod +x $@
