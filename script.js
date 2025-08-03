let sceneIndex = 0;
const width = 960;
const height = 850;
const totalScenes = 5;
const svgWidth = width;
const svgHeight = height;

let data;
d3.csv("Current_Employee_Names__Salaries__and_Position_Titles_20250726.csv")
  .then(csv => {
    console.log("CSV loaded successfully.");

    csv.forEach(d => {
      if (d["Annual Salary"]) {
        const cleanedSalary = d["Annual Salary"].replace(/[^0-9.-]+/g, "");
        d["Annual Salary"] = parseFloat(cleanedSalary);
      } else {
        d["Annual Salary"] = 0;
      }

      if (d["Job Titles"]) {
        d["Job Titles"] = d["Job Titles"].trim();
      }

      d["Hourly Rate"] = parseFloat(d["Hourly Rate"]) || 0;
      d["Typical Hours"] = parseFloat(d["Typical Hours"]) || 0;

      if (d["Salary or Hourly"] === "SALARY") {
        d["Effective Hours per Week"] = 40;
      } else {
        d["Effective Hours per Week"] = d["Typical Hours"];
      }

      if (d["Salary or Hourly"] === "SALARY") {
        d["Effective Salary"] = d["Annual Salary"];
      } else if (d["Salary or Hourly"] === "HOURLY") {
        d["Effective Salary"] = d["Hourly Rate"] * d["Effective Hours per Week"] * 52;
      } else {
        d["Effective Salary"] = 0;
      }

      if (d["Full or Part-Time"] === "F") {
        d["Employment Type"] = "Full-Time";
      } else {
        d["Employment Type"] = "Part-Time";
      }
    });

    data = csv;
    showScene(sceneIndex); 
  });


document.getElementById("prev-btn").addEventListener("click", () => {
  if (sceneIndex > 0) {
    sceneIndex--;
    showScene(sceneIndex);
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (sceneIndex < totalScenes - 1) {
    sceneIndex++;
    showScene(sceneIndex);
  }
});


function showScene(index) {
  d3.select("#scene-container").html("");

  d3.select("#prev-btn").attr("disabled", index === 0 ? true : null);
  d3.select("#next-btn").attr("disabled", index === totalScenes - 1 ? true : null);

  if (index === 0) {
    const svg = drawTitleScene();

  } else if (index === 1) {
    const svg = drawSalaryTypePie(data);
    
  } else if (index === 2) {
    const svg = drawDepartmentBarChart(data);
    
  } else if (index === 3) {
    const svg = drawDepartmentSalaryHistogram(data);

  } else if (index === 4) {
    const svg = drawPoliceRoleHistogram(data)
  }
}

function addAnnotation(g, marginBottom, chartWidth, chartHeight, titleText, detailText) {
  g.selectAll(".annotation").remove();

  const annotationX = 20;
  const annotationY = chartHeight - marginBottom;

  const annotationGroup = g.append("g")
    .attr("class", "annotation")
    .attr("transform", `translate(${annotationX}, ${annotationY})`);

  annotationGroup.append("text")
    .attr("class", "annotation-title")
    .attr("x", 0)
    .attr("y", 0)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(titleText);

  const wrappedDetail = detailText.split('\n');

  wrappedDetail.forEach((line, i) => {
    annotationGroup.append("text")
      .attr("class", "annotation-detail")
      .attr("x", 0)
      .attr("y", 20 + i * 18)
      .style("font-size", "13px")
      .text(line);
  });
}

// Scenes
function drawTitleScene() {
  const svg = d3.select("#scene-container").append("svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 4)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Exploring City of Chicago Employee Pay");

  addAnnotation(
    svg, 
    100,
    width, 
    height, 
    "How Are Chicago City Workers Paid?", 
    "This story explores the structure of city employment pay—starting with hourly vs. salaried, then drilling down into specific departments and job roles. Public\nservice roles range from administrative staff to law enforcement and specialized engineers all contributing to the operations of the city. By diving into their\ncompensation patterns, we uncover how different departments and roles are valued within the public workforce."
  );
  return svg;
}

function drawSalaryTypePie(chartData) {
  const salaryCounts = d3.rollup(chartData, v => v.length, d => d["Salary or Hourly"]);
  const pieData = Array.from(salaryCounts, ([label, value]) => ({ label, value }));
  
  const total = d3.sum(pieData, d => d.value);

  const radius = Math.min(width, height) / 3;
  const color = d3.scaleOrdinal().domain(pieData.map(d => d.label)).range(["#1f77b4", "#ff7f0e"]);
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const svg = d3.select("#scene-container").append("svg").attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

  g.selectAll("path").data(pie(pieData)).enter().append("path")
    .attr("d", arc).attr("fill", d => color(d.data.label))
    .append("title").text(d => `${d.data.label}: ${d.data.value.toLocaleString()}`);

  const text = g.selectAll("text").data(pie(pieData)).enter().append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("font-size", "14px").style("fill", "white");

  text.append("tspan")
      .attr("x", 0)
      .attr("dy", "-0.6em")
      .text(d => d.data.label);

  text.append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em")
      .text(d => d3.format(".1%")(d.data.value / total));

  svg.append("text").attr("x", width / 2).attr("y", 40).attr("text-anchor", "middle")
    .style("font-size", "24px").style("font-weight", "bold")
    .text("Distribution of Employee Compensation Type");

  addAnnotation(
    svg, 
    100,
    width, 
    height, 
    "Most City Workers Are on Salary", 
    "City employees are compensated in one of two primary ways: through an annual salary or an hourly wage. This chart shows the overall split between salaried and\nhourly workers in the City of Chicago workforce. Salaried roles often reflect full-time, long-term positions with more stable compensation structures, while\nhourly roles may include temporary, seasonal, or part-time work. This distinction helps us understand how employment structures vary across departments and\nroles. Based on this chart, salaried employees make up almost 78% of the total Chicago public workforce. As they make up the bulk of the public workforce, we\nwill focus our narrative visualization on their compensation patterns in the following scenes."
  );

  return svg;
}

function drawDepartmentBarChart(chartData) {
  const margin = { top: 50, right: 50, bottom: 150, left: 350 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const svg = d3.select("#scene-container").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const departmentRoleCounts = d3.rollups(
    chartData,
    v => ({
      SALARY: v.filter(d => d["Salary or Hourly"] === "SALARY").length,
      HOURLY: v.filter(d => d["Salary or Hourly"] === "HOURLY").length
    }),
    d => d["Department"]
  );

  const stackData = departmentRoleCounts.map(([department, counts]) => ({
    Department: department,
    SALARY: counts.SALARY,
    HOURLY: counts.HOURLY
  }));

  const topDepartments = stackData
    .sort((a, b) => (b.SALARY + b.HOURLY) - (a.SALARY + a.HOURLY))
    .slice(0, 10);

  const keys = ["SALARY", "HOURLY"];
  const color = d3.scaleOrdinal()
    .domain(keys)
    .range(["#1f77b4", "#ff7f0e"]);

  const y = d3.scaleBand()
    .domain(topDepartments.map(d => d.Department))
    .range([0, chartHeight])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(topDepartments, d => d.SALARY + d.HOURLY)])
    .nice()
    .range([0, chartWidth]);

  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "10px")
    .attr("dy", "0.25em");

  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",")));

  const stackedData = d3.stack().keys(keys)(topDepartments);

  g.selectAll("g.layer")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("y", d => y(d.data.Department))
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("height", y.bandwidth());

  g.selectAll(".label")
    .data(topDepartments)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.SALARY + d.HOURLY) + 5)
    .attr("y", d => y(d.Department) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text(d => d3.format(",")(d.SALARY + d.HOURLY))
    .style("font-size", "12px");

  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Top 10 Departments by Number of Employees (Salary vs Hourly)");

  const legend = svg.append("g")
    .attr("transform", `translate(${svgWidth - 180}, ${chartHeight - 370})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -10) 
    .text("Employee Type")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  keys.forEach((key, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(key));

    legendRow.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(key.charAt(0) + key.slice(1).toLowerCase())
      .style("font-size", "14px")
      .attr("alignment-baseline", "middle");
  });

  addAnnotation(
    svg, 
    100,
    width, 
    height, 
    "Police and Fire Departments Dominate Full-Time Roles", 
    "This chart highlights the ten City of Chicago departments with the highest number of employees, broken down by compensation type. The Police and Fire\nDepartments are the largest, with overwhelmingly salaried workforces. These two departments not only have large workforces but also the highest numbers of\nsalaried employees. In contrast, departments like Streets & Sanitation and Water Management follow in size but consist mainly of hourly workers. Due to the\nsheer size of the Chicago Police Department and its predominance of full-time salaried roles, it becomes important to analyze the compensation patterns of\nsalaried employees of the Chicago Police Department in the following scenes."
  );

  return svg;
}

function drawDepartmentSalaryHistogram(chartData) {
  const margin = { top: 80, right: 40, bottom: 150, left: 60 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const salariedData = chartData.filter(d => 
    d["Salary or Hourly"] && 
    d["Salary or Hourly"].trim() === "SALARY" &&
    d["Annual Salary"] > 0 &&
    d["Department"] === "CHICAGO POLICE DEPARTMENT"
  );

  const svg = d3.select("#scene-container").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const title = svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Salary Distribution for the Chicago Police Department");

  const deptData = salariedData.map(d => d["Annual Salary"]);

  const xDomain = d3.extent(deptData);
  const x = d3.scaleLinear().domain(xDomain).nice().range([0, chartWidth]);
  const bins = d3.bin().domain(x.domain()).thresholds(20)(deptData);
  const yMax = d3.max(bins, d => d.length);
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([chartHeight, 0]);

  g.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d => `$${d3.format(",.0f")(d / 1000)}k`))
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .text("Annual Salary");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -chartHeight / 2)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .text("Number of Employees");

  g.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => x(d.x0) + 1)
    .attr("y", d => y(d.length))
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => chartHeight - y(d.length))
    .attr("fill", "#1f77b4");

  addAnnotation(
    svg, 
    80,
    width, 
    height, 
    "Wide Range of Pay in the Chicago Police Department", 
    "This chart shows the distribution of annual salaries among full-time, salaried employees in the Chicago Police Department. While a large number of police\ndepartment employees earn between $90k and $130k annually, salaries vary greatly, from below $60K to over $200K, showing a broad compensation structure\nwithin the department. This variation reflects differences not only between ranks and roles, but also within the same job titles due to factors like tenure, overtime,\nor promotions. To better understand these patterns, we will examine compensation at the level of individual job titles in the next slide."
  );

  return svg;
}

function computeBoxplotStats(data) {
  const sorted = data.slice().sort(d3.ascending);
  const min = d3.min(sorted);
  const max = d3.max(sorted);
  const q1 = d3.quantileSorted(sorted, 0.25);
  const median = d3.quantileSorted(sorted, 0.5);
  const q3 = d3.quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;

  return { min, q1, median, q3, max, iqr };
}

function drawPoliceRoleHistogram(chartData) {
  const margin = { top: 80, right: 40, bottom: 50, left: 60 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const svg = d3.select("#scene-container").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const title = svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold");

  const policeData = chartData.filter(d =>
    d["Department"] === "CHICAGO POLICE DEPARTMENT" &&
    d["Salary or Hourly"] === "SALARY" &&
    !isNaN(+d["Annual Salary"]) &&
    +d["Annual Salary"] > 0
  );

  const roleGroups = d3.group(policeData, d => d["Job Titles"].trim());
  const roles = Array.from(roleGroups.entries())
    .filter(([_, v]) => v.length > 0)
    .map(([role]) => role)
    .sort();

  const controls = d3.select("#scene-container")
  .insert("div", ":first-child")
  .attr("id", "role-controls")
  .style("padding", "10px 0 10px 60px");

  controls.append("label")
    .attr("for", "role-select")
    .text("Select a Job Title: ");

  const dropdown = controls.append("select")
    .attr("id", "role-select");

  dropdown.selectAll("option")
    .data(roles)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  function updateHistogram(role) {
    const raw = roleGroups.get(role);
    const roleData = raw?.map(d => +d["Annual Salary"]) || [];

    let [min, max] = d3.extent(roleData);
    if (min === max) {
      min -= 1000;
      max += 1000;
    }

    const stats = computeBoxplotStats(roleData);

    const statsBox = d3.select("#boxplot-stats");
    if (statsBox.empty()) {
      d3.select("#scene-container")
        .append("div")
        .attr("id", "boxplot-stats")
        .style("padding", "10px 60px")
        .style("font-family", "sans-serif")
        .style("font-size", "18px");
    }

    d3.select("#boxplot-stats").html(`
      <strong>Boxplot Summary for ${role}</strong><br/>
      Min: $${d3.format(",.0f")(stats.min)}<br/>
      Q1: $${d3.format(",.0f")(stats.q1)}<br/>
      Median: $${d3.format(",.0f")(stats.median)}<br/>
      Q3: $${d3.format(",.0f")(stats.q3)}<br/>
      Max: $${d3.format(",.0f")(stats.max)}
    `);

    g.selectAll("*").remove();

    if (roleData.length === 0) {
      g.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight / 2)
        .attr("text-anchor", "middle")
        .text("No salary data available for this role.");
      title.text(`Salary Distribution for ${role}`);
      return;
    }

    const x = d3.scaleLinear()
      .domain([min, max])
      .nice()
      .range([0, chartWidth]);

    const bins = d3.bin()
      .domain(x.domain())
      .thresholds(15)(roleData);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .nice()
      .range([chartHeight, 0]);

    const yAxis = d3.axisLeft(y)
      .tickValues(
        y.ticks().filter(tick => Number.isInteger(tick))
      )
      .tickFormat(d3.format(","));

    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => `$${d3.format(",.0f")(d / 1000)}k`))
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Annual Salary");

    g.append("g")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -chartHeight / 2)
      .attr("y", -40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Number of Employees");

    g.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("y", d => y(d.length))
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", d => chartHeight - y(d.length))
      .attr("fill", "#1f77b4");

    title.text(`Salary Distribution for ${role}`);
  }

  if (roles.length > 0) {
    updateHistogram(roles[0]);
    dropdown.on("change", (event) => {
      updateHistogram(event.currentTarget.value);
    });
  } else {
    g.append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight / 2)
      .attr("text-anchor", "middle")
      .text("No Police Department roles with valid salary data.");
  }

  d3.select("#scene-container")
  .append("div")
  .attr("id", "role-annotation")
  .style("padding", "10px 60px")
  .style("font-family", "sans-serif")
  .style("color", "black")
  .style("max-width", "800px")
  .style("line-height", "1.4em")
  .style("word-wrap", "break-word")
  .html(`
    <div style="font-size: 16px; font-weight: bold; color: black;">Drill Down by Role</div>
    <div style="font-size: 13px; color: black;">
      Users can use the dropdown to explore salary distribution for specific roles. Here, we allow for user exploration of roles within the Chicago Police
      Department. This view helps reveal disparities across positions and provides insight into role-specific compensation bands and a boxplot summary of
      a given role.
    </div>
  `);

  return svg;
}
