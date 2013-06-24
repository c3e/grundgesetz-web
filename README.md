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

Edit the Kickstrap configuration file `kickstrap.less` and adapt the root directory to your needs. After that run:

    make less
    make uglifyjs

Last step: Copy all files to your webserver.

Have fun! :-)


##  ToDo

*   Better social media integration
    *   http://www.heise.de/extras/socialshareprivacy/
*   Write some words about terms of use/privacy policy.
*   Timeline
    *   Historischen Kontext recherchieren und ergänzen
    *   Styling
*   Allgemeines zum Grundgesetz (mit entsprechenden Verweisen auf Wikipedia & Co.)
*   Compaare revisions
    *   Nur Änderungen anzeigen; gesamter Text ist verwirrend und zu viel
*   Accessability
*   Bugs
    *   Auf der Hauptseite sind oben unter "Entdecken" die drei Buttons "Zeitleiste", "Vergleichen" und "Statistiken". Alle drei springen zwar zum vorgesehenen Anker, aber nicht zu der ganz korrekten Position auf dem Bildschirm (vgl. "Entdecken" im Drop-down-Menue). [46halbe]
    *   Beim Skalieren der Zeitleiste springt man leider zurueck zu dem zuletzt ausgewaehlten Beitrag, ich faende es schoener, wenn man da bleiben koennte, wo der Marker grade ist. Muss man halt ganz schoen weit scrollen manchmal.. [46halbe]
    *   Bei der oberen Ansicht der Zeitleiste sind manchmal bei der seitlichen Vor- und Rueckschau am rechten/linken Rand bei den Pfeilen die Formatierungen karp0tt, teilweise abgeschnitten und so (vgl. Eintrag 30.12.1954, Vorschau 28.12.1955) [46halbe]
    *   Bei n < 100 Artikel springt die naechste Anzeige nach oben, das sollte wohl nicht so gemeint sein. Bei n=100 geht der Sprung ans Seitenende. [46halbe]
    *   Zeitleiste unter Safari funktioniert nicht richtig.
    *   Ältere Firefox-Versionen (getestet mit 13.0.1) zeigen nicht alle Einträge in den Dropdown-Menüs.
*   l10n/i18n
