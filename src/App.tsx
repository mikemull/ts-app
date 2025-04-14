import { useState, useEffect, useRef} from 'react'
import './App.css'
import { useDebouncedCallback } from 'use-debounce';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from 'antd';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

import { dataSet, opSet } from './types/dataset';
import { tsPoint } from './types/timeseries';
import { ImportDialog } from './components/importdialog/ImportDialog';
import { DatasetPanel, isPlottable } from './components/DatasetPanel';
import { DatasetTools } from './components/DatasetTools';

const COLORS = ["red", "blue", "gray", "orange", "green", "purple", "yellow", "black"];

const chartContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginTop: '10px',
  marginBottom: '10px',
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
  const [forecasts, setForecasts] = useState<tsPoint[]>([]);
  const [currentDataset, setCurrentDataset] = useState<dataSet>();
  const [currOpset, setCurrOpset] = useState<opSet>();
  const [selectedTimeSeries, setSelectedTimeSeries] = useState<string[]>([]);
  const [selectedDsetIndex, setSelectedDsetIndex] = useState(0);
  const [offset, setOffset] = useState('0');
  const [limit, setLimit] = useState('1000');
  const [sliderUpper, setSliderUpper] = useState(1000);
  const [sliderLower, setSliderLower] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [seriesColors, setSeriesColors] = useState<{ [key: string]: string }>({});
  const [colorIndex, setColorIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const limitRef = useRef<HTMLInputElement>(null);
  const offsetRef = useRef<HTMLInputElement>(null);

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
      limitRef.current!.value = String(value[1] - value[0]);
      setOffset(String(sliderLower));
      offsetRef.current!.value = String(value[0]);
    }
  };

  const openDataset = (dataset: dataSet, index: number) => {
    const newColors: { [key: string]: string } = {};

    setSelectedDsetIndex(index);
    setCurrentDataset(dataset);
    if (dataset.ops.length > 0) {
      setSelectedItems(["ts_col_time"].concat(dataset.timestamp_cols[0]).concat(dataset.ops[0].plot));
      setSelectedTimeSeries(dataset.ops[0].plot);
      setLimit(String(dataset.ops[0].limit));
      limitRef.current!.value = String(dataset.ops[0].limit);
      setOffset(String(dataset.ops[0].offset));
      offsetRef.current!.value = String(dataset.ops[0].offset);
      setSliderLower(dataset.ops[0].offset);
      setSliderUpper(dataset.ops[0].offset + dataset.ops[0].limit);
      setCurrOpset(dataset.ops[0]);

      let colIndex = 0;
      for (const ts of dataset.ops[0].plot) {
        newColors[ts] = COLORS[colIndex % COLORS.length];
        colIndex++;
      }
      setColorIndex(colIndex);

      setSeriesColors(newColors);
    } else {
      setSelectedItems(["ts_col_time"].concat(dataset.timestamp_cols[0]));
      setTsData([]);
      setSelectedTimeSeries([]);
      setLimit(String(dataset.max_length));
      limitRef.current!.value = String(dataset.max_length);
      setSliderUpper(dataset.max_length);
      setSliderLower(0);
      setOffset("0");
    }
    setForecasts([]);
  };

  const addDataset = (
    newDataset: dataSet
  ) => {
    console.log('Adding');
    setDatasets([...datasets, newDataset]);
  }

  const deleteDataset = (dataset_id: string) => {
    // Close the add dialog

    fetch(`/tsapi/v1/datasets/${dataset_id}`, {
      method: 'delete'
    })
    .then(function(res) {
      console.log(res.status);
      const newDatasets = datasets.filter((dset) => dset.id !== dataset_id);
      setDatasets(newDatasets);
      if (newDatasets.length > 0) {
        openDataset(newDatasets[0], 0);
      } else {
        setCurrentDataset(undefined);
      }
    })
    .catch(function(err) {
      console.log(err.message);
    });
  }

  const onDatasetClick = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {

    const selectDset = datasets[index]
    setSelectedDsetIndex(index);
    setExpandedItems(["ts_col_time", "ts_col_series"]);
    console.log("selectDset.ops", selectDset.ops);
    openDataset(selectDset, index);

  }

  function onTreeClick(_: React.SyntheticEvent, itemIds: string[]) {
    const tsIds: string[] = [];

    console.log(itemIds);
    const selSet = new Set<string>(itemIds);

    for (const item of itemIds) {
      // Time series ID
      if (isPlottable(currentDataset, item)) {
        tsIds.push(item);
        if (!seriesColors[item]) {
          const color = COLORS[colorIndex % COLORS.length];
          setSeriesColors((prev) => ({ ...prev, [item]: color }));
          setColorIndex((prev) => prev + 1);
        }
      }
    }

    setSelectedItems(Array.from(selSet));
    setSelectedTimeSeries(tsIds.sort());
  }

  const debouncedOffsetChange = useDebouncedCallback(
    (value) => {
      setSliderLower(Number(value));
      setOffset(value);
    },
    // delay in ms
    1000
  );

  const debouncedLimitChange = useDebouncedCallback(
    (value) => {
      setSliderUpper(Number(sliderLower) + Number(value));
      setLimit(value);
    },
    // delay in ms
    1000
  );

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
          openDataset(data[0], 0);
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
            "plot": selectedTimeSeries,
            "offset": Number(offset),
            "limit": Number(limit)
          })
        });
        const jsonResp = await resp.json();
        currentDataset.ops.push(jsonResp);
        setCurrentDataset(currentDataset);
        setCurrOpset(jsonResp);
      } else {
        // Update existing opset
        const resp = await fetch(`/tsapi/v1/opsets/${currentDataset.ops[0].id}`, {
          method: 'put',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            "id": currentDataset.ops[0].id,
            "dataset_id": currentDataset.id,
            "plot": selectedTimeSeries,
            "offset": Number(offset),
            "limit": Number(limit)
          })
        });
        const jsonResp = await resp.json();
        currentDataset.ops[0] = jsonResp;
        setCurrentDataset(currentDataset);
        setCurrOpset(jsonResp);
      }
    };

    updateOpsetAndFetchData().catch(err => {
      console.log(err.message);
    });
  }, [currentDataset, offset, limit, selectedTimeSeries]);


  useEffect(() => {
    const fetchTSData = async () => {
      setLoading(true);
      if (currOpset === undefined) {
        return;
      }
      // Fetch time series data
      const dataResp = await fetch(`/tsapi/v1/tsop/${currOpset?.id}`);
      const data = await dataResp.json();
      setTsData(data.data);
      setLoading(false);
    };

    fetchTSData().catch(err => {
      console.log(err.message);
    });
  }, [currOpset]);


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
          <DatasetTools currentDataset={currentDataset} handleDelete={deleteDataset} setForecasts={setForecasts}/>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart 
              data={[...tsdata, ...forecasts]}
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
              {currOpset?.plot.map((ts) => (
                <Line 
                  dataKey={`data.${ts}`} 
                  key={ts} 
                  dot={false} 
                  stroke={seriesColors[ts] || COLORS[0]}
                  strokeWidth={1}
                  name={ts}
                  activeDot={{ r: 4 }}
                />
              ))}
              {forecasts.length > 0 && (
                <Line
                  dataKey="data.point" 
                  key="point" 
                  dot={true} 
                  stroke="#008000"
                  strokeWidth={1}
                  name="Forecast"
                  activeDot={{ r: 4 }}
                />
              )}
              {forecasts.length > 0 && (
                <Line
                  dataKey="data.upper" 
                  key="upper" 
                  dot={true} 
                  stroke="#800000"
                  strokeWidth={1}
                  name="Upper"
                  activeDot={{ r: 4 }}
                />
              )}
              {forecasts.length > 0 && (
                <Line
                  dataKey="data.lower" 
                  key="lower" 
                  dot={true} 
                  stroke="#000080"
                  strokeWidth={1}
                  name="Lower"
                  activeDot={{ r: 4 }}
                />
              )}
            </LineChart>
            
          </ResponsiveContainer>
          {loading && 
            <Box sx={{ width: '100%' }}>
              <LinearProgress />
            </Box>
          }
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
                  //value={offset}
                  ref={offsetRef}
                  onChange={(e) => debouncedOffsetChange(e.target.value)}
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
                  ref={limitRef}
                  //value={limit}
                  onChange={(e) => debouncedLimitChange(e.target.value)}
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
