jgivenReportApp.directive('a', function () {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            if (!attrs.href || attrs.target) {
                return;
            }

            if (!attrs.href.includes('jgiven.org')) {
                elem.on('click', function (e) {
                    e.preventDefault();
                    var newHref = '';
                    if (attrs.href.includes(`{{`)) {
                        newHref = attrs.href.slice(2, attrs.href.length - 2);
                    } else {
                        newHref = attrs.href;
                    }
                    scope.redirectTo(newHref);
                });
            } else {
                elem.on('click', function (e) {
                    e.preventDefault();
                    window.open('https://jgiven.org', '_blank');
                });
            }
        }
    }
});


jgivenReportApp.directive('i', function () {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            if (attrs.ngClick && attrs.ngClick.includes('removeBookmark')) {
                elem.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                })
            }
        }
    }
})