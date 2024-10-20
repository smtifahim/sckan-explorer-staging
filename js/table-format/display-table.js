// Return the populated table based on the search filters.

function getPopulatedTable(data) 
{
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "1250px";
  table.style.border = "1px solid black";

  const neuronDataMap = groupDataByNeuronID(data);

  for (const [neuronId, neuronData] of neuronDataMap) 
  {
    var gData = neuronData[0].diGraph.axonalPath;
    var gDataWithSynapse = neuronData[0].diGraphSynapse.axonalPath;
    var hasSynapse = neuronData[0].neuronMetaData.forwardConnections;

    const vizRow = createVizRow(gData, gDataWithSynapse, hasSynapse);
    const neuronRow = createNeuronRow(neuronId, gData, vizRow);
    const neuronDataRow = createNeuronDataRow(neuronData[0].neuronMetaData);
    const locationHeaderRow = createLocationHeaderRow();
    table.append(
      neuronRow,
      neuronDataRow,
      vizRow,
      locationHeaderRow,
      ...createDataRows(neuronData)
    );
    table.appendChild(createEmptyRow());
  }

  return table;
}

function groupDataByNeuronID(data)
{
  const neuronDataMap = new Map();
  for (const datum of data) {
    if (!neuronDataMap.has(datum.neuron.ID))
    {
      neuronDataMap.set(datum.neuron.ID, []);
    }
    neuronDataMap.get(datum.neuron.ID).push(datum);
  }
  return neuronDataMap;
}

function createNeuronRow(neuronId, gData, vizRow)
{
  const neuronRow = createTableRow("panel");
  const neuronHeader = createTableHeader("panel-header");
  neuronHeader.colSpan = 6;
  neuronHeader.innerHTML = `Neuron Population: ${neuronId}`;
  neuronHeader.style.cursor = 'default';
  
  if (gData !== "")
  {
    const visualizeButton = document.createElement('button');
    visualizeButton.innerHTML = '<b>Visualize<b>';
    visualizeButton.style.backgroundColor = "#C0F0FB";
    visualizeButton.style.cursor = 'pointer';
    visualizeButton.style.marginLeft = '10px';
    visualizeButton.addEventListener('click', () => togglePanel(vizRow));
    neuronHeader.appendChild(visualizeButton);
  }
  neuronHeader.style.border = "1px solid black";
  neuronHeader.style.backgroundColor = "black";
  neuronRow.appendChild(neuronHeader);
  return neuronRow;
}

function createVizRow(gData, gDataWithSynapse, hasSynapse)
{
  if (gData !== "")
  {
    const vizRow = createTableRow("panel-body");
    vizRow.style.display = 'none';
    
    const vizData = createTableData("");
    vizData.style.border = "none";
    vizData.colSpan = 6;
    
    const synapseCheckbox = getSynapseCheckBox();
    vizData.appendChild(synapseCheckbox);    
    synapseCheckbox.style.display = 'none'; //hide checkbox

    if (hasSynapse !== "")
    {
      synapseCheckbox.style.display = 'block'; //show checkbox
    }    
      
    // Create a containers for the toggle viz
    var divNonSynapse = document.createElement('div');
    divNonSynapse.id = "divNonSynapse";
    divNonSynapse.appendChild(getVizWithoutSynapse(gData));
    divNonSynapse.style.display = 'block'; // Initially show divNonSynapse
   
    var divSynapse = document.createElement('div');
    divSynapse.id = "divSynapse";
    divSynapse.appendChild (getVizWithSynapse(gDataWithSynapse));
    divSynapse.style.display = 'none'; // Initially hide divSynapse

    vizData.appendChild(divSynapse);
    vizData.appendChild(divNonSynapse);
    
     // Toggle effect for the checkbox
    synapseCheckbox.firstChild.addEventListener('change', function ()
    {
        if (this.checked)
        {      
          divSynapse.style.display = 'block'; // show viz
          divNonSynapse.style.display = 'none'; //hide viz
        }
        else
        {
          divSynapse.style.display = 'none'; // hide viz
          divNonSynapse.style.display = 'block'; //show viz
        }
    });

    vizData.appendChild(getVizLegend());   
    vizRow.appendChild(vizData);
    
    return vizRow;
  }
  return document.createElement("tr");
}

function getVizWithoutSynapse(gData)
{
  const div = document.createElement('div');
  div.id = "graphWithoutSynapse";
  const graphSVG = Viz(gData); //calling the Viz constructor from GraphViz's viz.js
  div.innerHTML = graphSVG;

  return div;
}

function getVizWithSynapse(gDataWithSynapse)
{
  const div = document.createElement('div');
  div.id = "graphWithSynapse";
  const graphSVG = Viz(gDataWithSynapse); //calling the Viz constructor from GraphViz's viz.js
  div.innerHTML = graphSVG;

  return div;
}

function getSynapseCheckBox()
{
    const synapseDiv = document.createElement('div');
    synapseDiv.style.display = 'inline-flex';     // Flexbox to align items horizontally
    synapseDiv.style.alignItems = 'center';
    synapseDiv.style.marginLeft = '10px';
    synapseDiv.style.marginTop = '10px';
    synapseDiv.style.marginBottom = '20px';
  
    // Create checkbox for synaptic connections
    const synapseCheckbox = document.createElement('input');
    synapseCheckbox.type = 'checkbox';
    synapseCheckbox.id = 'synapseCheckbox';
    synapseCheckbox.style.width = '25px';
    synapseCheckbox.style.height = '25px';
    synapseCheckbox.style.verticalAlign = 'middle';

    // Create label for checkbox
    const synapseLabel = document.createElement('label');
    synapseLabel.htmlFor = 'synapseCheckbox';
    synapseLabel.innerText = 'Show Synaptic Connections.';
    synapseLabel.style.backgroundColor = '#C0F0FB'; 
    synapseLabel.style.color = 'black';        
    synapseLabel.style.padding = '5px 5px';
    synapseLabel.style.cursor = 'pointer';
    synapseLabel.style.verticalAlign = 'middle';

    // Append checkbox and label to the div
    synapseDiv.appendChild(synapseCheckbox);
    synapseDiv.appendChild(synapseLabel);

    return synapseDiv;
}

function getVizLegend()
{
  const vizLegend = `digraph G 
                    {   
                        subgraph cluster_legend 
                        {
                            rankdir=LR; // Left-to-right layout for the legend
                            label = "Legend";
                            fontsize = 12;
                            shape = "rect";
                            style = "rounded, dotted"; // Dashed box around the legend
                            legend_synapse [label="Synapse\nLocation", fontsize=12, shape=rect, style="rounded, filled", fillcolor="#eefaec", peripheries=2, color=black];
                            legend_axon_sensory_terminal [label="Sensory\nTerminal", fontsize=12, shape=rect, color=red];
                            legend_axon_terminal [label="Axon\nTerminal", fontsize=12, shape=rect, style="rounded, diagonals, filled", fillcolor="#feeeee", color=red];
                            legend_axon [label="Axon\nLocation", fontsize=12, shape=rect, style="rounded, filled, dashed", fillcolor="#ecf1fe" color=black];
                            legend_soma [label="Soma\nLocation", fontsize=12, shape=rect, style="rounded, filled", fillcolor="#eefaec", color=black];
                        }
                    }`
  const div = document.createElement('div');
  div.id = "graphLegend";
  const graphSVG = Viz(vizLegend); //calling the Viz constructor from GraphViz's viz.js
  div.innerHTML = graphSVG;
  
  return div;
}

function createNeuronDataRow(neuronMetaData)
{
  const neuronDataRow = createTableRow();
  neuronDataRow.style.backgroundColor = "#EFF5FB";
  const neuronMetaDataCell = createTableData();
  neuronMetaDataCell.colSpan = 6;
  neuronMetaDataCell.innerHTML = getFormattedNeuronMetaData(neuronMetaData);
  neuronDataRow.appendChild(neuronMetaDataCell);
  return neuronDataRow;
}

function createLocationHeaderRow()
{
  const locationHeaderRow = createTableRow();
  locationHeaderRow.style.backgroundColor = "#A9D0F5";
  locationHeaderRow.style.border = "1px solid black";

  const headers = [
    "Origin",
    "Origin ID",
    "Destination",
    "Destination ID",
    "Via",
    "Via ID"
  ];

  for (const headerText of headers) {
    const headerCell = createTableHeader();
    headerCell.innerText = headerText;
    headerCell.style.border = "1px solid black";
    locationHeaderRow.appendChild(headerCell);
  }

  return locationHeaderRow;
}

// function createDataRows(neuronData)
// {
//   return neuronData.map(datum => {
//     const dataRow = createTableRow();
//     dataRow.style.backgroundColor = "#EFF5FB";
//     dataRow.appendChild(createTableData(datum.origin.Label));
//     dataRow.appendChild(createTableData(createLink(datum.origin.IRI, datum.origin.ID)));
//     dataRow.appendChild(createTableData(datum.destination.Label || "-"));
//     dataRow.appendChild(createTableData(createLink(datum.destination.IRI, datum.destination.ID)));
//     dataRow.appendChild(createTableData(datum.via ? datum.via.Label : "-"));
//     dataRow.appendChild(createTableData(createLink(datum.via.IRI, datum.via.ID)));
//     return dataRow;
//   });
// }

// To create unique rows for each population.
function createDataRows(neuronData) 
{
  const uniqueData = new Set();

  return neuronData
    .filter(datum => {
      // creating a unique key for each row, ensuring all relevant fields are consistently represented
      const key = [
        datum.origin.Label || "",
        datum.origin.IRI || "",
        datum.origin.ID || "",
        datum.destination.Label || "-",
        datum.destination.IRI || "",
        datum.destination.ID || "",
        datum.via ? datum.via.Label || "-" : "-",
        datum.via ? datum.via.IRI || "" : "",
        datum.via ? datum.via.ID || "" : ""
      ].join("|"); // joining all parts with a delimiter to form a unique string

      // check if the key is already in the Set
      if (uniqueData.has(key)) 
      {
        return false; // if duplicate is found, filter it out
      } 
      else 
      {
        uniqueData.add(key); // add the key to the Set
        return true; // include the row
      }
    })
    .map(datum => {
      const dataRow = createTableRow();
      dataRow.style.backgroundColor = "#EFF5FB";
      dataRow.appendChild(createTableData(datum.origin.Label));
      dataRow.appendChild(createTableData(createLink(datum.origin.IRI, datum.origin.ID)));
      dataRow.appendChild(createTableData(datum.destination.Label || "-"));
      dataRow.appendChild(createTableData(createLink(datum.destination.IRI, datum.destination.ID)));
      dataRow.appendChild(createTableData(datum.via ? datum.via.Label : "-"));
      dataRow.appendChild(createTableData(createLink(datum.via.IRI, datum.via.ID)));
      return dataRow;
    });
}

function createEmptyRow()
{
  const emptyRow = createTableRow();
  const emptyData = createTableData();
  emptyData.colSpan = 6;
  emptyData.style.border = "1px solid transparent";
  emptyRow.appendChild(emptyData);
  return emptyRow;
}

// function getFormattedNeuronMetaData(nmdata) 
// {
//   let text = `<strong>Label:</strong> ` + nmdata.neuronLabel;

//   if (nmdata.neuronPrefLabel !== "")
//     text +=  `<hr><strong>Preferred Label</strong><pre>  </pre>` + nmdata.neuronPrefLabel; 

//   text += `<hr><strong>Phenotype(s):</strong>` + nmdata.phenotypes;
//   if (nmdata.species !== "")
//     text += `<hr><b>Species:</b>` +  nmdata.species;

//   if (nmdata.sex !== "")
//     text += `; <b>Sex:</b>` + nmdata.sex;
  
//   if (nmdata.forwardConnections !== "")
//     text += `<hr><b>Forward Connection(s):</b>` +  nmdata.forwardConnections;
  
//   if (nmdata.reference !== "")
//     text += `<hr><b>Reference:</b>` +  addHyperlinksToURIs(nmdata.reference);
  
//   if (nmdata.alert !== "")
//     text += `<hr><b>Alert Note:</b>` + addHyperlinksToURIs(nmdata.alert);

//   text += "<br>";
//   return text;
// }

function getFormattedNeuronMetaData(nmdata) 
{
  let table = `<table style="border-collapse: collapse; width: 100%;">`;

  table += `<tr><td style="font-weight: bold; width: 25px;">Label</td>`;
  table += `<td style="width:90%">${nmdata.neuronLabel}</td></tr>`;

  // Will need to consider if we want the label to be displayed in title case
  // table += `<td style="width:90%">${convertToTitleCase(nmdata.neuronLabel)}</td></tr>`;

  if (nmdata.neuronPrefLabel !== "") 
  {
    table += `<tr><td style="font-weight: bold;">Preferred Label</td>`;
    table += `<td>${convertToTitleCase(nmdata.neuronPrefLabel)}</td></tr>`;
    
    // Will need to consider if we want the pref label to be displayed in title case
    // table += `<td>${convertToTitleCase(nmdata.neuronPrefLabel)}</td></tr>`;
  }

  table += `<tr><td style="font-weight: bold;">Phenotype(s)</td>`;
  table += `<td>${nmdata.phenotypes}</td></tr>`;

  if (nmdata.species !== "")
  {
    table += `<tr><td style="font-weight: bold;">Species</td>`;
    table += `<td>${nmdata.species}`;
    if (nmdata.sex !== "")
      table += `; <b>Sex:</b> ${convertToTitleCase(nmdata.sex)}`;
    table += `</td></tr>`;
  }

  // if (nmdata.sex !== "") {
  //   table += `<tr><td style="font-weight: bold;">Sex:</td>`;
  //   table += `<td>${titleCase(nmdata.sex)}</td></tr>`;
  // }

  if (nmdata.forwardConnections !== "")
  {
    table += `<tr><td style="font-weight: bold;">Forward Connection(s)</td>`;
    table += `<td>${nmdata.forwardConnections}</td></tr>`;
  }

  if (nmdata.diagramLink !== "")
  {
      table += `<tr><td style="font-weight: bold;">Model Diagram</td>`;
     // table += `<td>${addHyperlinksToURIs(nmdata.diagramLink)}</td></tr>`;
      table += `<td><a href="${nmdata.diagramLink}" target="_blank">Link to SVG Diagram</a></td></tr>`;

  }

  if (nmdata.reference !== "")
  {
    table += `<tr><td style="font-weight: bold;">Reference</td>`;
    table += `<td>${addHyperlinksToURIs(nmdata.reference)}</td></tr>`;
  }

  if (nmdata.citation !== "")
    {
      table += `<tr><td style="font-weight: bold;">Citations</td>`;
      table += `<td>${addHyperlinksToCitationURIs(nmdata.citation)}</td></tr>`;
    }

  if (nmdata.alert !== "")
  {
    table += `<tr><td style="font-weight: bold;">Alert Note</td>`;
    table += `<td>${addHyperlinksToURIs(nmdata.alert)}</td></tr>`;
  }

  table += `</table>`;
  return table;
}

// function titleCase(str) 
// {
//   return str.toLowerCase().split(' ').map(function(word) {
//     return word.replace(word[0], word[0].toUpperCase());
//   }).join(' ');
// }

function convertToTitleCase(sentence)
{
  const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'with',
                      'via', 'on', 'at', 'to', 'from', 'by', 'in', 'of'];
  const words = sentence.toLowerCase().split(/[\s,]+/);

  for (let i = 0; i < words.length; i++) 
  {
    const word = words[i];

    if (i === 0 || !smallWords.includes(word)) 
    {
      // Check if the word matches the pattern "X1-X9" or "X1-XN"
      if (/^[a-z]\d+(-[a-z]\d+|-[a-z]n)?$/.test(word)) 
      {
        words[i] = word.toUpperCase(); // Preserve the pattern in uppercase
      } 
      else 
      {
        words[i] = word.charAt(0).toUpperCase() + word.slice(1); // Convert other words to title case
      }
    }
  }

  return words.join(' ');
}

function addHyperlinksToURIs(text) 
{
    // Regular expression to match URIs ignoring punctuation charecters or any braces 
    // at the end of a url within the texts
    const uriRegex = /(https?:\/\/[^\s,:]+[^\s.)},;:])/g;
    
    // Replace URIs with hyperlinks
    const result = text.replace(uriRegex, '<a href="$&" target="_blank">$&</a>');
    
    return result;
}

function addHyperlinksToCitationURIs(urisString) 
{
    // Split the comma-separated string into an array of URIs
    const urisArray = urisString.split(',');

    const hyperlinksArray = urisArray.map(uri => 
    {
        const trimmedURI = uri.trim();  // Remove any extra spaces
        return `<a href="${trimmedURI}" target="_blank">${trimmedURI}</a>`;
    });

    // Join the array of hyperlinks back into a single string
    return hyperlinksArray.join(', ');
}


function togglePanel(panelBodyRow)
{
  panelBodyRow.style.display = panelBodyRow.style.display === 'none' ? 'table-row' : 'none';
}

function createTableRow(className)
{
  const row = document.createElement("tr");
  if (className) {
    row.classList.add(className);
  }
  return row;
}

function createTableHeader(className)
{
  const header = document.createElement("th");
  if (className) {
    header.classList.add(className);
  }
  return header;
}

function createTableData(content)
{
  const data = document.createElement("td");
  data.style.border = "1px solid black";
  if (content) {
    data.innerHTML = content;
  }
  return data;
}

function createLink(href, text)
{
  return `<a href="${href}" target="_blank">${text}</a>`;
}
