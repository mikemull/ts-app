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
import Modal from '@mui/material/Modal';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Slider } from 'antd';

const COLORS = ["red", "blue", "gray", "orange", "green", "purple", "yellow", "black"];
const catIds = new Set<string>(['ts_col_time', 'ts_col_series', 'ts_col_other']);

interface DatasetModalData {
  dataset_name: string;
  filepath: string;
}

interface TypedTreeItem extends TreeViewBaseItem {
  nodeType: string; 
}

type opSet = {
  id: string
  dataset_id: string
  plot: string[]
}

type dataSet = {
  id: string
  name: string
  description: string
  series_cols: string[]
  timestamp_cols: string[]
  max_length: number
  ops: opSet[]
  opset: opSet
};

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
    return [
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
  } else {
    return []
  }
}


const chartDivStyle = {
  padding: 20,
  width: 'calc(100% - 25px)',
  height: 400,
  minHeight: 400
};

function App() {
  const [datasets, setDatasets] = useState<dataSet[]>([]);
  const [tsdata, setTsData] = useState<tsPoint[]>([]);
  const [dset, setDset] = useState<dataSet>();
  const [opset, setOpset] = useState<opSet>();
  const [currts, setCurrts] = useState<string[]>([]);
  const [offset, setOffset] = useState('0');
  const [limit, setLimit] = useState('1000');
  const [sliderUpper, setSliderUpper] = useState(1000);
  const [sliderLower, setSliderLower] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [modalData, setModalData] = useState<DatasetModalData>({ dataset_name: '', filepath: '' });
  const [file, setFile] = useState<File | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      console.log('Uploading file...');
  
      const dsFormData = new FormData();
      dsFormData.append('name', modalData.dataset_name);
      dsFormData.append('file', file);
  
      try {
        // You can write the URL of your server or any other endpoint used for file upload
        const result = await fetch('/tsapi/v1/files', {
          method: 'POST',
          body: dsFormData,
        });
  
        const data = await result.json();
        console.log(data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setModalData({ ...modalData, [name]: value });
    console.log(modalData);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(modalData); // Handle form submission here
    setAddVisible(false);
  };

  const handleOpen = () => setAddVisible(true);
  const handleClose = () => setAddVisible(false);

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

  const formStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'rgb(51 65 85)',
    border: '2px solid #777',
    boxShadow: 24,
    p: 2,
  };

  const onDatasetClick = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    let tsIds: string[] = [];
    const selectDset = datasets[index]
    setDset(selectDset);
    setExpandedItems(["ts_col_time"]);
    if ((selectDset.opset !== undefined) && (selectDset.opset != null)) {
      setSelectedItems(["ts_col_time"].concat(selectDset.timestamp_cols[0]).concat(selectDset.opset.plot));
      tsIds = selectDset.opset.plot;
      setTsData([]);
    } else {
      setSelectedItems(["ts_col_time"].concat(selectDset.timestamp_cols[0]));
      setTsData([]);
    }
    
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
      if (dset != undefined) {
        if (item == "ts_col_time") {
          for (const col of dset.timestamp_cols) {
            selSet.add(col);
          }
        } 
        if (item == "ts_col_series") {
          for (const col of dset.series_cols) {
            selSet.add(col);
          }
          tsIds = dset.series_cols;
          allSeries = true;
        }
      }
    }

    if (!allSeries) {
      for (const item of itemIds) {
        // Time series ID
        if (isPlottable(dset, item)) {
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
          console.log(data);
          setDatasets(data);
       })
       .catch((err) => {
          console.log(err.message);
       });
  }, []);

  // Fetch time series data
  const fetchTsData = async () => {
    fetch(`/tsapi/v1/tsop/${dset?.opset.id}?offset=${offset}&limit=${limit}`)
    .then((response) => response.json())
    .then((data) => {
        setTsData(data.data);
    })
    .catch((err) => {
        console.log(err.message);
    });
  }

  // Make or update opset
  useEffect(() => {
    if (dset === undefined) {
      return;
    }

    if (dset.opset === undefined) {
      // Make an opset
      const fetchOpset = async () => {
        const resp = await fetch('/tsapi/v1/opsets', {
          method: 'post',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            "id": "0",
            "dataset_id": dset.id,
            "plot": currts
          })
        })
        const jsonResp = await resp.json();
        dset.opset = jsonResp;
        setDset(dset);
        setOpset(jsonResp);
        console.log(dset);
      }
      if (dset.ops.length > 0) {
        dset.opset = dset.ops[0];
        setDset(dset);
        setOpset(dset.ops[0]);
        setSelectedItems(selectedItems.concat(dset.opset.plot));
      } else {
        fetchOpset();
      }
      //fetchOpset().then(() => {
      //  fetchTsData();
      //});

    } else {
      fetch(`/tsapi/v1/opsets/${dset?.opset.id}`, {
        method: 'put',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          "id": dset?.opset.id,
          "dataset_id": dset.id,
          "plot": currts
        })
      })
      .then((response) => response.json())
      .then((data) => {
          dset.opset = data;
          setDset(dset);
          setOpset(data);
      })
      .catch((err) => {
          console.log(err.message);
      });
    }
  }, [currts, dset]);


  useEffect(() => {
    if (dset === undefined || dset.opset === undefined) {
      return;
    }

    fetchTsData();

  }, [offset, limit, opset, dset]);


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
              <Button variant="outlined"  size="small" onClick={handleOpen}>Add</Button>
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
              <List  sx={{bgcolor: '#3C3C4C'}}>
                {datasets.map((ds, idx) =>
                  <ListItem disablePadding>
                    <ListItemButton  onClick={(event) => {onDatasetClick(event, idx)}}>
                      <ListItemText primary={ds.name}/>
                    </ListItemButton>
                  </ListItem>
                )} 
              </List>
              <Divider/>
              <RichTreeView
                multiSelect
                items={dset ? makeTreeItem(dset) : []}
                checkboxSelection
                defaultExpandedItems={Array.from(catIds)}
                selectedItems={selectedItems}
                expandedItems={expandedItems}
                onExpandedItemsChange={handleExpandedItemsChange}
                onSelectedItemsChange={onTreeClick}
                slots={{ item: CustomTreeItem }}
              />
            </Box>
          </div>
        </div>

        <div className='w-full'>
          <div className='p-5' style={chartDivStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tsdata} >
                <XAxis dataKey="timestamp" angle={45} height={75}/>
                <YAxis/>
                {opset?.plot.map((ts, i) => <Line dataKey={`data.${ts}`} key={i} dot={false} stroke={COLORS[i % 8]}/>)}
              </LineChart>
            </ResponsiveContainer>

            <div>
            <Slider 
              range={{ draggableTrack: true }}
              min={0}
              max={dset?.max_length}
              defaultValue={[Number(offset), Number(limit)]} 
              value={[sliderLower, sliderUpper]} 
              onChange={onRangeChange}
              onChangeComplete={onRangeChangeComplete}
            />
            <label> Offset:
              <input
                name="offsetInput"
                defaultValue={offset} value={offset}
                onChange={onOffsetChange}/>
            </label>
            <label> Limit:
              <input name="limitInput" defaultValue={limit} value={limit}
              onChange={onLimitChange}/>
            </label>

            </div>            
          </div>

        </div>
      </div>

      <div>
        <Modal
          open={addVisible}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={formStyle}>
            <form className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-120" onSubmit={handleSubmit}>
              <div className="mb-1 flex flex-col gap-3">
                <label htmlFor="name">Dataset Name:</label>
                <input type="text" id="dataset_name" name="dataset_name" value={modalData.dataset_name} onChange={handleChange} />

                <input id="file" type="file" onChange={handleFileChange} />

                <button type="submit" onClick={handleUpload}>Submit</button>
              </div>
            </form>
          </Box>
        </Modal>
      </div>
    </>
  )
}

export default App
