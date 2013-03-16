docpatch_build = cd grundgesetz-dev && docpatch build -v -s
docpatch_create = cd grundgesetz-dev && docpatch create -v -t -r all -f

include Makefile.properties

deploy :
	@echo "Deploying..."
	@rsync --human-readable --progress --verbose --recursive --update --exclude=".git*" . $(host)

build :
	@echo "Building repo..."
	@$(docpatch_build)

create :
	@echo "Creating output formats..."
	@$(docpatch_create) pdf
	@$(docpatch_create) epub
	@$(docpatch_create) html
	@$(docpatch_create) odt
	@$(docpatch_create) plain
	@$(docpatch_create) json
	@$(docpatch_create) docbook
	@$(docpatch_create) opendocument
	@$(docpatch_create) latex
	@$(docpatch_create) texinfo
	@$(docpatch_create) man
	@$(docpatch_create) markdown
	@$(docpatch_create) rst
	@$(docpatch_create) mediawiki
	@$(docpatch_create) textile
	@$(docpatch_create) rtf
	@$(docpatch_create) org

less :
	@echo "Compiling less..."
	@lessc -x -O2 kickstrap.less > Kickstrap/css/kickstrap.min.css
