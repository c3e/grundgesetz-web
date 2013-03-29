#   DocPatch Website


##  Deployment

Clone this repository and fetch all sub modules:

    git clone https://github.com/bheisig/docpatch-web.git
    git submodule init
    git submodule update

Build the repository and create output files:

    make build
    make create

Type `docpatch help` for more information.

Edit the Kickstrap configuration file `kickstrap.less` and adapt the root directory to your needs. Create and configure `Makefile.properties`. After that run:

    make less
    make uglifyjs
    make deploy

Have fun! :-)


##  ToDo

*   Zeitleiste
    *   Historischen Kontext recherchieren und ergänzen
*   Allgemeines zum Grundgesetz (mit entsprechenden Verweisen auf Wikipedia & Co.)
*   Historie einzelner Artikel betrachten
*   Vergleichen
    *   Nur Änderungen anzeigen; gesamter Text ist verwirrend und zu viel
*   Herunterladen
    *   Restliche Formate hinzufügen
*   Logo + Favicon
