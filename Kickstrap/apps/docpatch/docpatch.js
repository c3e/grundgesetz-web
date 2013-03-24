DocPatch = {
    prefix: "brd_grundgesetz_",
    repoDir: "grundgesetz-dev",
    dateFormat: "dd.mm.yy",
    meta: {},
    previousRevisionID: 0,
    formats: [
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
            "title": "Textile",
            "ext": "textile"
        }
    ]
};

DocPatch.calculateAge = function(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

DocPatch.drawChangesPerYear = function() {
    var range = _.range(
        Number($.datepicker.formatDate('yy', new Date(_.first(DocPatch.meta.revisions).announced))),
        Number($.datepicker.formatDate('yy', new Date(_.last(DocPatch.meta.revisions).announced))) + 1
    );
    
    var changesPerYear = {};
    
    $.each(range, function() {
        changesPerYear[this.valueOf()] = 0;
    });

    $.each(DocPatch.meta.revisions, function() {
        var year = Number($.datepicker.formatDate('yy', new Date(this.announced)));
        changesPerYear[year]++;
    });

    var data = {
        labels : range,
        datasets : [
            {
                data : $.map(changesPerYear, function(value, key) { return value; })
            }
        ]
    }

    var options = {}
    
    var ctx = $("#changesPerYear").get(0).getContext("2d");
    var chart = new Chart(ctx).Bar(data, options);
}

DocPatch.drawChangesPerPeriod = function() {
    var range = _.range(
        // Skip the first revision:
        Number(DocPatch.meta.revisions[1].legislativeSession.id),
        Number(_.last(DocPatch.meta.revisions).legislativeSession.id) + 1
    );

    var changesPerPeriod = {};
    
    $.each(range, function() {
        changesPerPeriod[this.valueOf()] = 0;
    });

    $.each(DocPatch.meta.revisions, function() {
        if (this.legislativeSession) {
            var year = Number(this.legislativeSession.id);
            changesPerPeriod[year]++;
        }
    });

    var data = {
        labels : range,
        datasets : [
            {
                data : $.map(changesPerPeriod, function(value, key) { return value; })
            }
        ]
    }

    var options = {}
    
    var ctx = $("#changesPerPeriod").get(0).getContext("2d");
    var chart = new Chart(ctx).Bar(data, options);
}

DocPatch.compareRevisions = function(firstRevision, secondRevision) {
    var dmp = new diff_match_patch();
    var firstText = '';
    var secondText = '';
    var firstRevisionTitle = 'ohne Titel';
    var secondRevisionTitle = 'ohne Titel';
    var firstRevisionAnnounced = 'ohne Datum';
    var secondRevisionAnnounced = 'ohne Datum';

    if (firstRevision != '-1') {
        var firstRevisionID = DocPatch.createRevisionID(DocPatch.meta.revisions[firstRevision]);
        
        firstText = DocPatch.fetchOrCache(
            firstRevisionID,
            DocPatch.repoDir + '/out/' + DocPatch.prefix + firstRevisionID + '.txt',
            'text',
            false
        );

        firstRevisionTitle = DocPatch.meta.revisions[firstRevision].title;
        firstRevisionAnnounced = $.datepicker.formatDate(DocPatch.dateFormat, new Date(DocPatch.meta.revisions[firstRevision].announced));
    }
    
    if (secondRevision != '-1') {
        var secondRevisionID = DocPatch.createRevisionID(DocPatch.meta.revisions[secondRevision]);
        
        secondText = DocPatch.fetchOrCache(
            secondRevisionID,
            DocPatch.repoDir + '/out/' + DocPatch.prefix + secondRevisionID + '.txt',
            'text',
            false
        );
        
        secondRevisionTitle = DocPatch.meta.revisions[secondRevision].title;
        secondRevisionAnnounced = $.datepicker.formatDate(DocPatch.dateFormat, new Date(DocPatch.meta.revisions[secondRevision].announced));
    }

    dmp.Diff_Timeout = 1.0;
    dmp.Diff_EditCost = 4.0;

    var d = dmp.diff_main(firstText, secondText);
    //dmp.diff_cleanupSemantic(d);
    //dmp.diff_cleanupEfficiency(d);
    var comparisionOutput = dmp.diff_prettyHtml(d);
    
    $('#compareModalLabel').html('Fassung &bdquo;<span class="highlightfirstrevision">' + firstRevisionTitle + '</span>&rdquo; (' + firstRevisionAnnounced + ') verglichen mit Fassung &bdquo;<span class="highlightsecondrevision">' + secondRevisionTitle + '</span>&rdquo; (' + secondRevisionAnnounced + ')');

    $('#compareModal .modal-body').html(comparisionOutput);
    
    $('#compareModal').modal();
}

DocPatch.createRevisionID = function(revision) {
    return revision.id + '_' + revision.announced;
}

DocPatch.fetchOrCache = function(key, url, type, async) {
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

DocPatch.collectMetaData = function(revision) {
    var collectedMetaData = [];
    var year;
    
    if (revision.passed) {
        var passed = new Date(revision.passed);
        year = $.datepicker.formatDate('yy', passed);
        
        collectedMetaData.push({
            key: 'Verabschiedet',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, passed) + '</a>'
        });
    }
    
    if (revision.date) {
        var date = new Date(revision.date);
        year = $.datepicker.formatDate('yy', date);
        
        collectedMetaData.push({
            key: 'Gesetz vom',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, date) + '</a>'
        });
    }
    
    if (revision.announced) {
        var announced = new Date(revision.announced);
        year = $.datepicker.formatDate('yy', announced);
        
        collectedMetaData.push({
            key: 'Angekündigt',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, announced) + '</a>'
        });
    }
    
    if (revision.effectiveSince) {
        var effectiveSince = new Date(revision.effectiveSince);
        year = $.datepicker.formatDate('yy', effectiveSince);
        
        collectedMetaData.push({
            key: 'Inkraftgetreten am',
            value: '<a href="http://de.wikipedia.org/wiki/' + year + '" title="' + year + ' (Wikipedia)">' + $.datepicker.formatDate(DocPatch.dateFormat, effectiveSince) + '</a>'
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
            value: '<a href="javascript:DocPatch.compareRevisions(\'' + DocPatch.previousRevisionID + '\', \'' + revision.id + '\')" title="">' + articles.join('; ') + '</a>'
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
    
    if (revision.legislativeSession) {
        collectedMetaData.push({
            key: '<a href="http://de.wikipedia.org/wiki/Deutscher_Bundestag" title="Deutscher Bundestag (Wikipedia)">Legislaturperiode</a>',
            value: '<a href="' + revision.legislativeSession.uri + '" title="' + revision.legislativeSession.id + '. Bundestag (Wikipedia)">' + revision.legislativeSession.id + '. Bundestag</a>'
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
    
    DocPatch.previousRevisionID = revision.id;
    
    return collectedMetaData;
}

DocPatch.formatMeta = function(revision) {
    var formatted;
    
    formatted = '<table>';
    
    var collectedMetaData = DocPatch.collectMetaData(revision);
    
    $.each(collectedMetaData, function() {
        formatted += '<tr><th>' + this.key + ':</th><td>' + this.value + '</td></tr>';
    });
    
    formatted += '</table>';
    
    return formatted;
}
