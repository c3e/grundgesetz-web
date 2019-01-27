docpatch_build = cd grundgesetz-dev && docpatch build -v --valid-dates
docpatch_create = cd grundgesetz-dev && docpatch create -v --toc --revision all --format

build :
	$(docpatch_build)

create :
	$(docpatch_create) pdf
	$(docpatch_create) epub
	$(docpatch_create) html
	$(docpatch_create) odt
	$(docpatch_create) plain
	$(docpatch_create) json
	$(docpatch_create) docbook
	$(docpatch_create) opendocument
	$(docpatch_create) latex
	$(docpatch_create) man
	$(docpatch_create) markdown
	$(docpatch_create) rst
	$(docpatch_create) mediawiki
	$(docpatch_create) textile
	$(docpatch_create) rtf
	$(docpatch_create) org

less :
	lessc --clean-css kickstrap.less > Kickstrap/css/kickstrap.min.css

uglifyjs :
	uglifyjs Kickstrap/apps/docpatch/docpatch.js --output Kickstrap/apps/docpatch/docpatch.min.js --compress
