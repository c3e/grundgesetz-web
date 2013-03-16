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

    make deploy

Have fun! :-)


##  ToDo

*   Zeitleiste
    *   Meta-Daten ergänzen
    *   Historischen Kontext recherchieren und ergänzen
*   Historie einzelner Artikel betrachten
*   Vergleichen
    *   Nur Änderungen anzeigen; gesamter Text ist verwirrend und zu viel
*   Herunterladen
    *   Restliche Formate hinzufügen
*   Deployment
    *   Less kompilieren
*   Logo + Favicon
