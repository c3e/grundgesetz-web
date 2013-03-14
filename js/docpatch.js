ks.ready(function() {
    var prefix = 'brd_grundgesetz_';
    var repoDir = 'grundgesetz-dev';
    
    $('#topnav').onePageNav({
        currentClass: 'current',
        changeHash: false,
        scrollSpeed: 750,
        scrollOffset: 80
    });
    
    $.ajax({
        url: repoDir + "/etc/meta.json",
        dataType: "json"
    }).done(function(data) {
        var meta = data.revisions.reverse();
        var announced;

        $.each(meta, function() {
            announced = $.datepicker.formatDate('dd.mm.yy', new Date(this.announced));
            
            $('#revision, #firstrevision, #secondrevision')
                .append('<option value="' + this.id + '_' + announced + '">' + (this.id + 1) + '. vom ' + announced + ': ' + this.title + ')</option>');
        });
    
        var formats = [
            {
                "title": "PDF",
                "ext": "pdf"
            },
            {
                "title": "eBook (EPUB)",
                "ext": "epub"
            },
            {
                "title": "HTML",
                "ext": "html"
            },
            {
                "title": "Open Document Format (ODT)",
                "ext": "odt"
            },
            {
                "title": "Plain text (txt)",
                "ext": "txt"
            }
        ];
        
        $.each(formats, function() {
            $('#format').append('<option value="' + this.ext + '">' + this.title + '</option>');
        });
        
        $('#download').attr(
            'action',
            repoDir + '/out/' + prefix + $('#revision').val() + '.' + $('#format').val()
        );
        
        $('#revision, #format').change(function() {
            $('#download').attr(
                'action',
                repoDir + '/out/' + prefix + $('#revision').val() + '.' + $('#format').val()
            );
        });
        
        $('#latest').attr(
            'href',
            repoDir + '/out/' + prefix + $('#revision option:first').val() + '.pdf'
        );
        
        $('#latest').attr(
            'title',
            (meta[0].id + 1) + '. Fassung "' + meta[0].title + '" vom ' + $.datepicker.formatDate('dd.mm.yy', new Date(meta[0].announced)) + ' PDF-Format herunterladen'
        );
        
        var timelineData = {
            "timeline": {
                "headline": data.title,
                "type": "default",
                "text": data.subject,
                "startDate": "1949,5,23",
                "date": []
            }
        };
        
        var revisions = data.revisions;
        
        $.each(revisions, function() {
            var announced = new Date(this.announced);

            timelineData.timeline.date.push({
                "startDate": $.datepicker.formatDate('yy,m,d', announced),
                "endDate": $.datepicker.formatDate('yy,m,d', announced),
                "headline": this.title,
                "text": "<table><tr><th>Angekündigt:</th><td>"+$.datepicker.formatDate('d.m.yy', announced)+"</td></tr></table>",
                "asset": {
                    "media": "",
                    "credit": "",
                    "caption": ""
                }
            });
        });
    
        createStoryJS({
            type: "timeline",
            width: "100%",
            height: "600",
            source: timelineData,
            lang: "de",
            css: "Kickstrap/apps/timelinejs/css/timeline.css",
            js: "Kickstrap/apps/timelinejs/js/timeline-min.js",
            //font: "DroidSerif-DroidSans"
        });
        
        $('#comparerevisions').click(function() {
            var dmp = new diff_match_patch();
            var firstText = '';
            var secondText = '';
            
            var firstRevision = $('#firstrevision').val();
            if (firstRevision != '-1') {
                $.ajax({
                    url: repoDir + "/out/" + prefix + firstRevision + ".txt",
                    dataType: "text",
                    async: false
                }).done(function(text) {
                    firstText = text;
                });
            }
            
            var secondRevision = $('#secondrevision').val();
            if (secondRevision != '-1') {
                $.ajax({
                    url: repoDir + "/out/" + prefix + secondRevision + ".txt",
                    dataType: "text",
                    async: false
                }).done(function(text) {
                    secondText = text;
                });
            }

            dmp.Diff_Timeout = 1.0;
            dmp.Diff_EditCost = 4.0;

            var d = dmp.diff_main(firstText, secondText);
            //dmp.diff_cleanupSemantic(d);
            //dmp.diff_cleanupEfficiency(d);
            var comparisionOutput = dmp.diff_prettyHtml(d);
            
            $('#compareModalLabel').html('Fassung &bdquo;<span class="highlightfirstrevision">' + $('#firstrevision').find(':selected').text() + '</span>&rdquo; verglichen mit Fassung &bdquo;<span class="highlightsecondrevision">' + $('#secondrevision').find(':selected').text() + '</span>&rdquo;');
            $('#compareModal .modal-body').html(comparisionOutput);
            
            $('#compareModal').modal();
        });
    });
});
