import { useState, useEffect, ChangeEvent} from 'react'
import './App.css'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from 'antd';

import { dataSet, opSet } from './types/dataset';
import { ImportDialog } from './components/importdialog/ImportDialog';
import { DatasetPanel, isPlottable } from './components/DatasetPanel';

const COLORS = ["red", "blue", "gray", "orange", "green", "purple", "yellow", "black"];

type tsPoint = {
  name: string
  x: number
};

const chartContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  margin: '20px',
  padding: '20px',
  flex: 1
};

const chartControlsStyle = { 
  marginTop: '20px', 
  padding: '15px', 
  backgroundColor: '#f5f5f5', 
  borderRadius: '4px',
  border: '1px solid #eee'
};

function App() {
  const [datasets, setDatasets] = useState<dataSet[]>([]);
  const [tsdata, setTsData] = useState<tsPoint[]>([]);
  const [currentDataset, setCurrentDataset] = useState<dataSet>();
  const [opset, setOpset] = useState<opSet>();
  const [selectedDsetIndex, setSelectedDsetIndex] = useState(1);
  const [currts, setCurrts] = useState<string[]>([]);
  const [offset, setOffset] = useState('0');
  const [limit, setLimit] = useState('1000');
  const [sliderUpper, setSliderUpper] = useState(1000);
  const [sliderLower, setSliderLower] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<{ [key: string]: string }>({});

  const handleCloseImport = () => setImportVisible(false);
  const handleOpenImport = () => setImportVisible(true);

  const handleOpenAdd = () => setAddVisible(true);
  const handleCloseAdd = () => setAddVisible(false);

  const onRangeChange = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setSliderLower(value[0]);
      setSliderUpper(value[1]);
    }
  };
  
  const onRangeChangeComplete = (value: number | number[]) => {
    if (Array.isArray(value)) {
      setLimit(String(sliderUpper - sliderLower));
      setOffset(String(sliderLower));
    }
  };

  const addDataset = (
    newDataset: dataSet
  ) => {
    console.log('Adding');
    setDatasets([...datasets, newDataset]);
  }

  const onDatasetClick = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    let tsIds: string[] = [];
    const selectDset = datasets[index]
    setCurrentDataset(selectDset);
    setSelectedDsetIndex(index);
    setExpandedItems(["ts_col_time", "ts_col_series"]);
    if (selectDset.ops.length > 0) { //((selectDset.opset !== undefined) && (selectDset.opset != null)) {
      console.log("selectDset.ops", selectDset.ops);
      setSelectedItems(["ts_col_time"].concat(selectDset.timestamp_cols[0]).concat(selectDset.ops[0].plot));
      tsIds = selectDset.ops[0].plot;
      setOpset(selectDset.ops[0]);
      setTsData([]);
      setLimit(String(selectDset.ops[0].limit));
      setSliderUpper(selectDset.ops[0].offset + selectDset.ops[0].limit);
      setSliderLower(selectDset.ops[0].offset);
      setOffset(String(selectDset.ops[0].offset));
    } else {
      setSelectedItems(["ts_col_time"].concat(selectDset.timestamp_cols[0]));
      setTsData([]);
      setLimit(String(selectDset.max_length));
      setSliderUpper(selectDset.max_length);
      setSliderLower(0);
      setOffset("0");
    }
    
    const newColors: { [key: string]: string } = {};
    let colorIndex = 0;
    for (const ts of tsIds) {
      newColors[ts] = COLORS[colorIndex % COLORS.length];
      colorIndex++;
    }
    setSeriesColors(newColors);

    setCurrts(tsIds.sort());
  }

  function onTreeClick(_: React.SyntheticEvent, itemIds: string[]) {
    let tsIds: string[] = [];
    let allSeries = false;

    console.log(itemIds);
    const selSet = new Set<string>(itemIds);

    // First, check for top-level selections
    for (const item of itemIds) {
      // Select all in category
      if (currentDataset != undefined) {
        if (item == "ts_col_time") {
          for (const col of currentDataset.timestamp_cols) {
            selSet.add(col);
          }
        } 
        if (item == "ts_col_series") {
          for (const col of currentDataset.series_cols) {
            selSet.add(col);
          }
          tsIds = currentDataset.series_cols;
          allSeries = true;
        }
      }
    }

    if (!allSeries) {
      for (const item of itemIds) {
        // Time series ID
        if (isPlottable(currentDataset, item)) {
          tsIds.push(item);
        }
      }
    }
 
    console.log(selSet);
    setSelectedItems(Array.from(selSet));
    console.log(tsIds);
    console.log(selectedItems);
    setCurrts(tsIds.sort());
  }

  function onOffsetChange(event: ChangeEvent<HTMLInputElement>) {
    setOffset(event.target.value);
    setSliderLower(Number(event.target.value));
  }

  function onLimitChange(event: ChangeEvent<HTMLInputElement>) {
    setLimit(event.target.value);
    setSliderUpper(Number(sliderLower) + Number(event.target.value));
  }

  const handleExpandedItemsChange = (
    _: React.SyntheticEvent,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);
  };

  // Get all of the datasets
  useEffect(() => {
    fetch('/tsapi/v1/datasets')
       .then((response) => response.json())
       .then((data) => {
          setDatasets(data);
       })
       .catch((err) => {
          console.log(err.message);
       });
  }, []);

  // Make or update opset and fetch data
  useEffect(() => {
    if (currentDataset === undefined) {
      return;
    }

    const updateOpsetAndFetchData = async () => {
      if (currentDataset.ops.length === 0) {
        // Make an opset
        const resp = await fetch('/tsapi/v1/opsets', {
          method: 'post',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            "id": "0",
            "dataset_id": currentDataset.id,
            "plot": currts,
            "offset": Number(offset),
            "limit": Number(limit)
          })
        });
        const jsonResp = await resp.json();
        currentDataset.ops.push(jsonResp);
        setCurrentDataset(currentDataset);
        setOpset(jsonResp);
      } else {
        // Update existing opset
        const resp = await fetch(`/tsapi/v1/opsets/${currentDataset.ops[0].id}`, {
          method: 'put',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            "id": currentDataset.ops[0].id,
            "dataset_id": currentDataset.id,
            "plot": currts,
            "offset": Number(offset),
            "limit": Number(limit)
          })
        });
        const jsonResp = await resp.json();
        currentDataset.ops[0] = jsonResp;
        setCurrentDataset(currentDataset);
        setOpset(jsonResp);
      }

      // Fetch time series data
      const dataResp = await fetch(`/tsapi/v1/tsop/${currentDataset.ops[0].id}?offset=${offset}&limit=${limit}`);
      const data = await dataResp.json();
      setTsData(data.data);
    };

    updateOpsetAndFetchData().catch(err => {
      console.log(err.message);
    });
  }, [currts, currentDataset, offset, limit]);

  return (
    <>
      <div style={{ display: 'flex', width: '100%', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <DatasetPanel 
          datasets={datasets}
          currentDataset={currentDataset}
          selectedDsetIndex={selectedDsetIndex}
          selectedItems={selectedItems}
          expandedItems={expandedItems}
          onDatasetClick={onDatasetClick}
          onTreeClick={onTreeClick}
          handleExpandedItemsChange={handleExpandedItemsChange}
          handleOpenAdd={handleOpenAdd}
          handleOpenImport={handleOpenImport}
        />

        <div style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={tsdata}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                angle={-45} 
                height={100}
                interval="preserveStartEnd"
                minTickGap={50}
                tick={{ 
                  fontSize: 12,
                  fill: '#666',
                  transform: 'translate(0, 10)'
                }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
              />
              <YAxis 
                tick={{ 
                  fontSize: 12,
                  fill: '#666'
                }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                label="timestamp"
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                wrapperStyle={{ 
                  paddingBottom: '20px',
                  fontSize: '14px',
                  color: '#333'
                }}
              />
              {opset?.plot.map((ts) => (
                <Line 
                  dataKey={`data.${ts}`} 
                  key={ts} 
                  dot={false} 
                  stroke={seriesColors[ts] || COLORS[0]}
                  strokeWidth={2}
                  name={ts}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div style={chartControlsStyle}>
            <Slider 
              range={{ draggableTrack: true }}
              min={0}
              max={currentDataset?.max_length}
              defaultValue={[Number(offset), Number(limit)]} 
              value={[sliderLower, sliderUpper]} 
              onChange={onRangeChange}
              onChangeComplete={onRangeChangeComplete}
            />
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontWeight: 500,
                color: '#333',
                fontSize: '14px'
              }}>
                Offset:
                <input
                  name="offsetInput"
                  defaultValue={offset} 
                  value={offset}
                  onChange={onOffsetChange}
                  style={{ 
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    width: '80px',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                fontWeight: 500,
                color: '#333',
                fontSize: '14px'
              }}>
                Limit:
                <input 
                  name="limitInput" 
                  defaultValue={limit} 
                  value={limit}
                  onChange={onLimitChange}
                  style={{ 
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    width: '80px',
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
              </label>
            </div>
          </div>            
        </div>
      </div>

      <ImportDialog open={addVisible} uploadType="add" onClose={handleCloseAdd} addDataset={addDataset}></ImportDialog>
      <ImportDialog open={importVisible} uploadType="import" onClose={handleCloseImport} addDataset={addDataset}></ImportDialog>
    </>
  )
}

export default App
