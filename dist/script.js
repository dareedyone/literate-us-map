const educationData = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const countyData = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

const tooltip = d3.select("#svgcontainer").
append("div").
attr("id", "tooltip").
attr("class", "tooltip").
style("opacity", 0);

const w = 960,h = 600;

//append svg

const svg = d3.select("#svgcontainer").
append("svg").
attr("width", w).
attr("height", h).
attr("class", "bg-light");

const unemploy = d3.map();

const path = d3.geoPath();

let xScale = d3.scaleLinear().
domain([2.6, 75.1]).
rangeRound([600, 860]);

let color = d3.scaleThreshold().
domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8)).
range(d3.schemeGreens[9]);
let legend = svg.append("g").
attr("class", "key").
attr("id", "legend").
attr("transform", "translate(0, 40)");

legend.selectAll("rect").
data(color.range().map(d => {
  d = color.invertExtent(d);
  if (d[0] == null) d[0] = xScale.domain()[0];
  if (d[1] == null) d[1] = xScale.domain()[1];
  return d;
})).
enter().append("rect").
attr("height", 10).
attr("x", function (d) {return xScale(d[0]);}).
attr("width", function (d) {return xScale(d[1]) - xScale(d[0]);}).
attr("fill", function (d) {return color(d[0]);});


legend.call(d3.axisBottom(xScale).
tickSize(12).
tickFormat(x => Math.round(x) + '%').
tickValues(color.domain())).
select(".domain").
remove();

let drawMap = (err, us, education) => {
  if (err) throw err;

  svg.append("g").
  attr("class", "counties").
  selectAll("path").
  data(topojson.feature(us, us.objects.counties).features).
  enter().append("path").
  attr("class", "county").
  attr("data-fips", d => d.id).
  attr("data-education", d => {
    let result = education.filter(obj => obj.fips == d.id);
    if (result[0]) {
      return result[0].bachelorsOrHigher;
    }

    return 0;
  }).
  attr("fill", d => {
    let result = education.filter(obj => obj.fips == d.id);
    if (result[0]) {
      return color(result[0].bachelorsOrHigher);
    }

    return color(0);
  }).
  attr("d", path).
  on("mouseover", d => {
    tooltip.style("opacity", .9);
    tooltip.html(function () {
      let result = education.filter(obj => obj.fips == d.id);
      if (result[0]) {
        return result[0]['area_name'] + ', ' + result[0]['state'] + ': ' + result[0].bachelorsOrHigher + '%';
      }
      //could not find a matching fips id in the data
      return 0;
    }).
    attr("data-education", () => {
      let result = education.filter(obj => obj.fips == d.id);
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }

      return 0;
    }).
    style("left", d3.event.pageX + 10 + "px").
    style("top", d3.event.pageY - 28 + "px");}).
  on("mouseout", d => tooltip.style("opacity", 0));

  svg.append("path").
  datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b)).
  attr("class", "states").
  attr("d", path);
};


d3.queue().
defer(d3.json, countyData).
defer(d3.json, educationData).
await(drawMap);