import { useState, useEffect, ChangeEvent} from 'react'
import './App.css'

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { TreeItem2, TreeItem2Props } from '@mui/x-tree-view/TreeItem2';
import { useTreeItem2Utils } from '@mui/x-tree-view/hooks';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from 'antd';

import { dataSet, opSet } from './types/dataset';
import { ImportDialog } from './components/importdialog/ImportDialog';

const COLORS = ["red", "blue", "gray", "orange", "green", "purple", "yellow", "black"];
const catIds = new Set<string>(['ts_col_time', 'ts_col_series', 'ts_col_other']);


interface TypedTreeItem extends TreeViewBaseItem {
  nodeType: string; 
}


type tsPoint = {
  name: string
  x: number
};


function isPlottable(ds: dataSet | undefined, itemId: string): boolean {
  return findItemParent(ds, itemId) == "ts_col_series";
}


function findItemParent(ds: dataSet | undefined, itemId: string): string | null {

  if (ds != undefined) {
    if (ds.series_cols.find((id) => id === itemId) != undefined) {
      return "ts_col_series";
    } else if (ds.timestamp_cols.find((id) => id === itemId) != undefined) {
      return "ts_col_time";
    } else {
      return null;
    }
  } else {
    return null;
  }

}


function makeTreeItem(ds: dataSet | undefined): TypedTreeItem[] {
  if (ds != undefined) {
    const groups = [
      {
      id: "ts_col_time",
      label: "Time Columns",
      nodeType: "ds",
      children: ds.timestamp_cols.map((s_id) => ({id: s_id, label: s_id}))
      },
      {
        id: "ts_col_series",
        label: "Numeric Columns",
        nodeType: "ds",
        children: ds.series_cols.map((s_id) => ({id: s_id, label: s_id}))
      }
    ]
    if (ds.other_cols.length > 0) {
      groups.push({
        id: "ts_other_series",
        label: "Other Columns",
        nodeType: "ds",
        children: ds.other_cols.map((s_id) => ({id: s_id, label: s_id}))
      });
    }
    return groups;
  } else {
    return []
  }
}


const chartDivStyle = {
  padding: 20,
  width: 'calc(100% - 25px)',
  height: 400,
  minHeight: 400,
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
    } else {
      setSelectedItems(["ts_col_time"].concat(selectDset.timestamp_cols[0]));
      setTsData([]);
    }
    
    const newColors: { [key: string]: string } = {};
    let colorIndex = 0;
    for (const ts of tsIds) {
      newColors[ts] = COLORS[colorIndex % COLORS.length];
      colorIndex++;
    }
    setSeriesColors(newColors);

    setLimit(String(selectDset.max_length));
    setSliderUpper(selectDset.max_length);
    setSliderLower(0);
    setOffset("0");
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
            "plot": currts
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
            "plot": currts
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


  function CustomTreeItem(props: TreeItem2Props) {
    const { status } = useTreeItem2Utils({
      itemId: props.itemId,
      children: props.children,
    });
  
    return (
      <TreeItem2
        {...props}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slotProps={{ checkbox: { visible: !status.expandable } as any }}
      />
    );
  }

  return (
    <>
      <div className="flex justify-start w-full">
        <div className='bg-slate-700'>
          <div className='flex justify-between p-2'>
            <div className='flex justify-center text-l font-bold'>
            Datasets
            </div>
            <div className='flex justify-items-end'>
              <Button variant="outlined"  size="small" onClick={handleOpenAdd} sx={{margin: "2px 5px 2px 5px"}}>Add</Button>
              <Button variant="outlined"  size="small" onClick={handleOpenImport} sx={{margin: "2px 5px 2px 5px"}}>Import</Button>
            </div>
          </div>
          <div>
            <Box sx={{
                minHeight: 600,
                minWidth: 250,
                maxHeight:800,
                mb: 2,
                display: "flex",
                flexDirection: "column",
                height: 700,
                overflow: "hidden",
                overflowY: "scroll"
               }}>
              <List  sx={{
                bgcolor: '#3C3C4C',
                '& .MuiListItemText-primary': {
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}>
                {datasets.map((ds, idx) =>
                  <ListItem disablePadding>
                    <ListItemButton  onClick={(event) => {onDatasetClick(event, idx)}}  selected={selectedDsetIndex === idx}>
                      <ListItemText primary={ds.name}/>
                    </ListItemButton>
                  </ListItem>
                )} 
              </List>
              <Divider/>
              <RichTreeView
                multiSelect
                items={currentDataset ? makeTreeItem(currentDataset) : []}
                checkboxSelection
                defaultExpandedItems={Array.from(catIds)}
                selectedItems={selectedItems}
                expandedItems={expandedItems}
                onExpandedItemsChange={handleExpandedItemsChange}
                onSelectedItemsChange={onTreeClick}
                slots={{ item: CustomTreeItem }}
                sx={{
                  '& .MuiTreeItem-label': {
                    fontSize: '14px',
                    fontWeight: 500
                  },
                  '& .MuiTreeItem-group': {
                    marginLeft: '8px'
                  }
                }}
              />
            </Box>
          </div>
        </div>

        <div className='w-full'>
          <div className='p-5' style={chartDivStyle}>
            <ResponsiveContainer width="100%" height="100%">
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
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), '']}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
                {opset?.plot.map((ts, i) => (
                  <Line 
                    dataKey={`data.${ts}`} 
                    key={i} 
                    dot={false} 
                    stroke={seriesColors[ts] || COLORS[0]}
                    strokeWidth={2}
                    name={ts}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
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
      </div>

      <ImportDialog open={addVisible} uploadType="add" onClose={handleCloseAdd} addDataset={addDataset}></ImportDialog>
      <ImportDialog open={importVisible} uploadType="import" onClose={handleCloseImport} addDataset={addDataset}></ImportDialog>
    </>
  )
}

export default App
