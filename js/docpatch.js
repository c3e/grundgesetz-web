var prefix = 'brd_grundgesetz_';
var repoDir = 'grundgesetz-dev';
var dateFormat = 'dd.mm.yy';
var meta;
    
ks.ready(function() {
    
    $('#topnav').onePageNav({
        currentClass: 'current',
        changeHash: false,
        scrollSpeed: 750,
        scrollOffset: 80
    });
    
    meta = window.fetchOrCache(
        'meta',
        repoDir + '/etc/meta.json',
        'json',
        false
    );

    $.each(meta.revisions.reverse(), function() {
        $('#revision, #firstrevision, #secondrevision')
            .append('<option value="' + this.id + '">' + (this.id + 1) + '. vom ' + $.datepicker.formatDate(dateFormat, new Date(this.announced)) + ': ' + this.title + '</option>');
    });
    
    meta.revisions.reverse();

    var formats = [
        {
            "title": "DocBook",
            "ext": "db"
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
            "title": "JSON",
            "ext": "json"
        },
        {
            "title": "Klartext (txt)",
            "ext": "txt"
        },
        {
            "title": "LaTeX",
            "ext": "tex"
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
            "title": "Mediawiki",
            "ext": "wiki"
        },
        {
            "title": "Open Document",
            "ext": "xml"
        },
        {
            "title": "Open Document Format (ODT)",
            "ext": "odt"
        },
        {
            "title": "org mode (Emacs)",
            "ext": "org"
        },
        {
            "title": "PDF",
            "ext": "pdf"
        },
        {
            "title": "RST",
            "ext": "text"
        },
        {
            "title": "RTF",
            "ext": "rtf"
        },
        {
            "title": "TeX Info",
            "ext": "texi"
        },
        {
            "title": "Textile",
            "ext": "textile"
        }
    ];
    
    $.each(formats, function() {
        $('#format').append('<option value="' + this.ext + '" title="' + this.ext + '">' + this.title + '</option>');
    });
    
    $('#format option[value="pdf"]').attr('selected', 'selected');
    
    $('#download').attr(
        'action',
        repoDir + '/out/' + prefix + $('#revision').val() + '.' + $('#format').val()
    );
    
    $('#revision, #format').change(function() {
        var revisionID = window.createRevisionID(meta.revisions[Number($('#revision').val())]);
        
        $('#download').attr(
            'action',
            repoDir + '/out/' + prefix + revisionID + '.' + $('#format').val()
        );
    });
    
    $('#latest').attr(
        'href',
        repoDir + '/out/' + prefix + window.createRevisionID(meta.revisions[0]) + '.pdf'
    );
    
    $('#latest').attr(
        'title',
        (meta.revisions[0].id + 1) + '. Fassung "' + meta.revisions[0].title + '" vom ' + $.datepicker.formatDate(dateFormat, new Date(meta.revisions[0].announced)) + ' im PDF-Format herunterladen'
    );
    
    var timelineData = {
        "timeline": {
            "headline": meta.title,
            "type": "default",
            "text": meta.subject,
            "startDate": "1949,5,23",
            "date": []
        }
    };
    
    var previousRevisionID;
    
    collectMetaData = function(revision) {
        var collectedMetaData = [];
        
        if (revision.passed) {
            collectedMetaData.push({
                key: 'Verabschiedet',
                value: $.datepicker.formatDate(dateFormat, new Date(revision.passed))
            });
        }
        
        if (revision.date) {
            collectedMetaData.push({
                key: 'Gesetz vom',
                value: $.datepicker.formatDate(dateFormat, new Date(revision.date))
            });
        }
        
        if (revision.announced) {
            collectedMetaData.push({
                key: 'Angekündigt',
                value: $.datepicker.formatDate(dateFormat, new Date(revision.announced))
            });
        }
        
        if (revision.effectiveSince) {
            collectedMetaData.push({
                key: 'Inkraftgetreten am',
                value: $.datepicker.formatDate(dateFormat, new Date(revision.effectiveSince))
            });
        }
        
        if (revision.articles) {
            var articles = [];
            
            if (revision.articles.created) {
                articles.push(
                    'Artikel ' + revision.articles.created.join(', ') + ' hinzugefügt'
                );
            }
            
            if (revision.articles.updated) {
                articles.push(
                    'Artikel ' + revision.articles.updated.join(', ') + ' verändert'
                );
            }
            
            if (revision.articles.deleted) {
                articles.push(
                    'Artikel ' + revision.articles.deleted.join(', ') + ' entfernt'
                );
            }
            
            collectedMetaData.push({
                key: 'Änderungen',
                value: '<a href="javascript:window.compareRevisions(\'' + previousRevisionID + '\', \'' + revision.id + '\')" title="">' + articles.join('; ') + '</a>'
            });
        }
        
        if (revision.signedOffBy) {
            var signedOffBy = [];
            
            $.each(revision.signedOffBy, function() {
                signedOffBy.push(
                    ((this.uri) ? '<a href="' + this.uri + '" title="' + this.uri + '">' + this.name + '</a>' : this.name) + ' (' + this.role + ')'
                );
            });
            
            collectedMetaData.push({
                key: 'Unterschreiber',
                value: signedOffBy.join(', ')
            });
        }
        
        if (revision.sources) {
            var sources = [];
            
            $.each(revision.sources, function() {
                sources.push(
                    this.title + ', Seite ' + this.pages
                );
            });
            
            collectedMetaData.push({
                key: 'Quellen',
                value: sources.join(', ')
            });
        }
        
        if (revision.electionPeriod) {
            collectedMetaData.push({
                key: '<a href="http://de.wikipedia.org/wiki/Deutscher_Bundestag" title="Deutscher Bundestag (Wikipedia)">Legislaturperiode</a>',
                value: revision.electionPeriod
            });
        }
        
        if (revision.votes) {
            var votes = [];
            
            if (revision.votes.yes) {
                votes.push(
                    revision.votes.yes + ' Ja-Stimme' + (revision.votes.yes != 1 ? 'n' : '')
                );
            }
            
            if (revision.votes.no) {
                votes.push(
                    revision.votes.no + ' Nein-Stimme' + (revision.votes.no != 1 ? 'n' : '')
                );
            }
            
            if (revision.votes.abstentions) {
                votes.push(
                    revision.votes.abstentions + ' Enthaltung' + (revision.votes.abstentions != 1 ? 'en' : '')
                );
            }
            
            collectedMetaData.push({
                key: 'Abstimmung',
                value: votes.join(', ')
            });
        }
        
        if (revision.initiativeOf) {
            collectedMetaData.push({
                key: 'Initiative von',
                value: revision.initiativeOf
            });
        }
        
        previousRevisionID = revision.id;
        
        return collectedMetaData;
    }
    
    formatMeta = function(revision) {
        var formatted;
        
        formatted = '<table>';
        
        var collectedMetaData = collectMetaData(revision);
        
        $.each(collectedMetaData, function() {
            formatted += '<tr><th>' + this.key + ':</th><td>' + this.value + '</td></tr>';
        });
        
        formatted += '</table>';
        
        return formatted;
    }
    
    $.each(meta.revisions, function() {
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
        var firstRevision = Number($('#firstrevision').val());
        var secondRevision = Number($('#secondrevision').val());
        
        window.compareRevisions(firstRevision, secondRevision);
    });
});
    
window.compareRevisions = function(firstRevision, secondRevision) {
    var dmp = new diff_match_patch();
    var firstText = '';
    var secondText = '';
    var firstRevisionTitle = '';
    var secondRevisionTitle = '';

    if (firstRevision != '-1') {
        var firstRevisionID = window.createRevisionID(meta.revisions[firstRevision]);
        
        firstText = window.fetchOrCache(
            firstRevisionID,
            repoDir + '/out/' + prefix + firstRevisionID + '.txt',
            'text',
            false
        );
        
        firstRevisionTitle = meta.revisions[firstRevision].title;
    } else {
        firstRevisionTitle = 'ohne Titel';
    }
    
    if (secondRevision != '-1') {
        var secondRevisionID = window.createRevisionID(meta.revisions[secondRevision]);
        
        secondText = window.fetchOrCache(
            secondRevisionID,
            repoDir + '/out/' + prefix + secondRevisionID + '.txt',
            'text',
            false
        );
        
        secondRevisionTitle = meta.revisions[secondRevision].title;
    } else {
        secondRevisionTitle = 'ohne Titel';
    }

    dmp.Diff_Timeout = 1.0;
    dmp.Diff_EditCost = 4.0;

    var d = dmp.diff_main(firstText, secondText);
    //dmp.diff_cleanupSemantic(d);
    //dmp.diff_cleanupEfficiency(d);
    var comparisionOutput = dmp.diff_prettyHtml(d);
    
    $('#compareModalLabel').html('Fassung &bdquo;<span class="highlightfirstrevision">' + firstRevisionTitle + '</span>&rdquo; verglichen mit Fassung &bdquo;<span class="highlightsecondrevision">' + secondRevisionTitle + '</span>&rdquo;');
    $('#compareModal .modal-body').html(comparisionOutput);
    
    $('#compareModal').modal();
}

window.createRevisionID = function(revision) {
    return revision.id + '_' + revision.announced;
}

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
