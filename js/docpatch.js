ks.ready(function() {
    var prefix = 'brd_grundgesetz_';
    var repoDir = 'grundgesetz-dev';
    var dateFormat = 'dd.mm.yy';
    
    $('#topnav').onePageNav({
        currentClass: 'current',
        changeHash: false,
        scrollSpeed: 750,
        scrollOffset: 80
    });
    
    var data = window.fetchOrCache(
        'meta',
        repoDir + '/etc/meta.json',
        'json',
        false
    );

    var meta = data.revisions.reverse();

    $.each(meta, function() {
        $('#revision, #firstrevision, #secondrevision')
            .append('<option value="' + this.id + '_' + this.announced + '">' + (this.id + 1) + '. vom ' + $.datepicker.formatDate(dateFormat, new Date(this.announced)) + ': ' + this.title + '</option>');
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
        $('#format').append('<option value="' + this.ext + '" title="' + this.ext + '">' + this.title + '</option>');
    });
    
    $('#format').append('<option disabled="disabled">&mdash; Weitere Formate: &mdash;</option>');

    var formats = [
        {
            "title": "JSON",
            "ext": "json"
        },
        {
            "title": "DocBook",
            "ext": "db"
        },
        {
            "title": "Open Document",
            "ext": "xml"
        },
        {
            "title": "LaTeX",
            "ext": "tex"
        },
        {
            "title": "TeX Info",
            "ext": "texi"
        },
        {
            "title": "Man Page",
            "ext": "gz"
        },
        {
            "title": "Markdown",
            "ext": "md"
        },
        {
            "title": "RST",
            "ext": "text"
        },
        {
            "title": "Mediawiki",
            "ext": "wiki"
        },
        {
            "title": "Textile",
            "ext": "textile"
        },
        {
            "title": "RTF",
            "ext": "rtf"
        },
        {
            "title": "org mode (Emacs)",
            "ext": "org"
        }
    ];
    
    $.each(formats, function() {
        $('#format').append('<option value="' + this.ext + '" title="' + this.ext + '">' + this.title + '</option>');
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
        (meta[0].id + 1) + '. Fassung "' + meta[0].title + '" vom ' + $.datepicker.formatDate(dateFormat, new Date(meta[0].announced)) + ' im PDF-Format herunterladen'
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
    
    formatMeta = function(revision) {
        var formatted;
        
        formatted = "<table>";
        
        if (revision.passed) {
            formatted += "<tr><th>Verabschiedet:</th><td>" + $.datepicker.formatDate(dateFormat, new Date(revision.passed)) + "</td></tr>";
        }
        
        if (revision.date) {
            formatted += "<tr><th>Gesetz vom:</th><td>" + $.datepicker.formatDate(dateFormat, new Date(revision.date)) + "</td></tr>";
        }
        
        if (revision.announced) {
            formatted += "<tr><th>Angekündigt:</th><td>" + $.datepicker.formatDate(dateFormat, new Date(revision.announced)) + "</td></tr>";
        }
        
        if (revision.articles) {
            
        }
        
        //if (revision.initiative-of) {
        //    formatted += "<tr><th>Initiative von:</th><td>" //+ revision.initiative-of + "</td></tr>";
        //}
        
        formatted += "</table>";
        
        return formatted;
    }
    
    $.each(revisions, function() {
        var announced = new Date(this.announced);

        timelineData.timeline.date.push({
            "startDate": $.datepicker.formatDate('yy,m,d', announced),
            "endDate": $.datepicker.formatDate('yy,m,d', announced),
            "headline": this.title,
            "text": formatMeta(this),
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
            firstText = window.fetchOrCache(
                firstRevision,
                repoDir + '/out/' + prefix + firstRevision + '.txt',
                'text',
                false
            );
        }
        
        var secondRevision = $('#secondrevision').val();
        if (secondRevision != '-1') {
            secondText = window.fetchOrCache(
                secondRevision,
                repoDir + '/out/' + prefix + secondRevision + '.txt',
                'text',
                false
            );
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

window.fetchOrCache = function(key, url, type, async) {
    if (localStorage) {
        var value = localStorage.getItem(key);
        
        if (!value) {
            $.ajax({
                url: url,
                dataType: type,
                async: async
            }).done(function(response) {
                value = response;
                
                if (type == 'json') {
                    response = JSON.stringify(response);
                }
                
                localStorage.setItem(key, response);
            });
        } else if (type == 'json') {
            value = JSON.parse(value);
        }
        
        return value;
    } else {
        $.ajax({
            url: url,
            dataType: type,
            async: async
        }).done(function(response) {
            return response;
        });
    }
}
