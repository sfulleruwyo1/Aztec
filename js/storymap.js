    (function ($) {
        'use strict';


        $.fn.storymap = function (options) {

            var defaults = {
                selector: '[data-place]',
                breakpointPos: '33.333%',
                createMap: function () {
                    // create a map in the "map" div, set the view to a given place and zoom
                    var map = L.map('map').setView([39.75576851405812, -104.98329162597656], 9);

                    // add an OpenStreetMap tile layer
                    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                    }).addTo(map);

                    return map;
                }
            };

            var settings = $.extend(defaults, options);


            if (typeof (L) === 'undefined') {
                throw new Error('Storymap requires Laeaflet');
            }
            if (typeof (_) === 'undefined') {
                throw new Error('Storymap requires underscore.js');
            }

            function getDistanceToTop(elem, top) {
                var docViewTop = $(window).scrollTop();

                var elemTop = $(elem).offset().top;

                var dist = elemTop - docViewTop;

                var d1 = top - dist;

                if (d1 < 0) {
                    return $(window).height();
                }
                return d1;

            }

            function highlightTopPara(paragraphs, top) {

                var distances = _.map(paragraphs, function (element) {
                    var dist = getDistanceToTop(element, top);
                    return {
                        el: $(element),
                        distance: dist
                    };
                });

                //console.log(distances);

                var closest = _.min(distances, function (dist) {
                    return dist.distance;
                });

                //console.log(closest);

                _.each(paragraphs, function (element) {
                    var paragraph = $(element);
                    if (paragraph[0] !== closest.el[0]) {
                        paragraph.trigger('notviewing');
                    }
                });

                if (!closest.el.hasClass('viewing')) {
                    closest.el.trigger('viewing');
                }
            }

            function watchHighlight(element, searchfor, top) {
                var paragraphs = element.find(searchfor);
                highlightTopPara(paragraphs, top);
                $(window).scroll(function () {
                    highlightTopPara(paragraphs, top);
                });
            }

            var makeStoryMap = function (element, markers) {

                var topElem = $('<div class="breakpoint-current"></div>')
                    .css('top', settings.breakpointPos);
                $('body').append(topElem);

                var top = topElem.offset().top - $(window).scrollTop();

                var searchfor = settings.selector;

                var paragraphs = element.find(searchfor);

                paragraphs.on('viewing', function () {
                    $(this).addClass('viewing');
                });

                paragraphs.on('notviewing', function () {
                    $(this).removeClass('viewing');
                });

                watchHighlight(element, searchfor, top);

                var map = settings.createMap();

                var initPoint = map.getCenter();
                var initZoom = map.getZoom();

                var fg = L.featureGroup().addTo(map);

                function showMapView(key) {

                    fg.clearLayers();
                    if (key === 'overview') {
                        map.setView(initPoint, initZoom, true);
                    } else if (markers[key]) {
                        var marker = markers[key];
                        var layer = marker.layer;
                        if (typeof layer !== 'undefined') {
                            fg.addLayer(layer);
                        };

                        //Create object for leaflet ICON
                        let aztecIcon = L.icon({
                            iconUrl: 'img/logo.png',
                            iconSize: [40, 40], // size of the icon
                            iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
                            popupAnchor: [21, 10] // point from which the popup should open relative to the iconAnchor
                        });

                        //set popup content
                        let content =
                            `<div style = 'text-align: center;' class = 'popupHeader noMouse'><h2>${marker.name}</h2></div>`;
                        content += `<div class="border-top my-3"></div>`
                        content += `<div>`;
                        content += `${marker.comment}`
                        content += `<br></div>`
                        content += `<div class = 'text-center'><button id = ${marker.id} type = 'button' class = 'btn btn-outline-light'>Additional Info.</button></div>`

                        //create new marker
                        let newMarker = L.marker([marker.lat, marker.lon], {icon: aztecIcon});

                        // bind popup to marker
                        newMarker.bindPopup(content);

                        //add marker to feature groupe
                        fg.addLayer(newMarker);

                        //fly to marker location and zoom in based on marker zoom level
                        map.flyTo([marker.lat, marker.lon], marker.zoom, 1);

                        // once map has completed move event open the popup on the marker.
                        map.once('moveend', function() {
                            newMarker.openPopup();
                        });
                        
                    }

                }


                paragraphs.on('viewing', function () {
                    showMapView($(this).data('place'));
                });
            };

            makeStoryMap(this, settings.markers);

            return this;
        }

    }(jQuery));