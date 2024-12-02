import { useState, useEffect } from 'react'
import './App.css'

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import Modal from '@mui/material/Modal';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Slider } from 'antd';

const COLORS = ["red", "blue", "gray", "orange", "green", "purple", "yellow", "black"];

interface DatasetModalData {
  dataset_name: string;
  filepath: string;
}

interface TypedTreeItem extends TreeViewBaseItem {
  nodeType: string; 
}

type dataSet = {
  id: string,
  name: string,
  description: string,
  series_cols: string[]
  max_length: number
};

type tsPoint = {
  name: string,
  x: number
};

function makeTreeItem(ds: dataSet): TypedTreeItem {
  return {
    id: ds.id,
    label: ds.name,
    nodeType: "ds",
    children: ds.series_cols.map((s_id) => ({id: s_id, label: s_id}))
  }
}

function makeTreeItems(dslist: dataSet[]): TypedTreeItem[] {
  return dslist.map(makeTreeItem);
}

const chartDivStyle = {
  padding: 20,
  width: 'calc(100% - 25px)',
  height: 300,
  minHeight: 300
};

function App() {
  const [datasets, setDatasets] = useState<dataSet[]>([]);
  const [tsdata, setTsData] = useState<tsPoint[]>([]);
  const [dset, setDset] = useState<dataSet>();
  const [currts, setCurrts] = useState<string[]>(['MT_001']);
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
      console.log(dsFormData);
  
      try {
        // You can write the URL of your server or any other endpoint used for file upload
        const result = await fetch('http://localhost:8000/files', {
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
    // console.log('onChange: ', value);
    if (Array.isArray(value)) {
      setSliderLower(value[0]);
      setSliderUpper(value[1]);
    }
  };
  
  const onRangeChangeComplete = (value: number | number[]) => {
    console.log('onChangeComplete: ', value);
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

  //function onTreeClick(event: React.SyntheticEvent, itemIds: string[], isSelected: boolean[]) {
  function onTreeClick(event: React.SyntheticEvent, itemIds: string[]) {
    const tsIds: string[] = [];

    setSelectedItems(itemIds);
    console.log(itemIds);
    for (const item of itemIds) {
      const dsItem = datasets.find(ds => ds.id === item)
      if (dsItem === undefined) {
        // Time series ID
        // alert(item);
        tsIds.push(item);
      } else {
        // Dataset ID
        if (dsItem) {
          setDset(dsItem);
          if (dsItem.id != dset?.id) {
            setSelectedItems([item]);
            setExpandedItems([item]);
            setLimit(String(dsItem.max_length));
            setSliderUpper(dsItem.max_length);
            setSliderLower(0);
            setOffset("0");
            break;
          }
        }
      }
    }
    setCurrts(tsIds.sort());
  }

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);
  };

  useEffect(() => {
    fetch('http://localhost:8000/datasets')
       .then((response) => response.json())
       .then((data) => {
          console.log(data);
          setDatasets(data);
       })
       .catch((err) => {
          console.log(err.message);
       });
  }, []);

  useEffect(() => {
    let baseUrl = "http://localhost:8000";
    let tsUrl = new URL("/ts", baseUrl);

    if (dset === undefined || currts.length == 0) {
      return;
    }

    console.log(dset?.id);
    fetch(new URL(`/tsm/${dset?.id}:${currts.join(',')}?offset=${offset}&limit=${limit}`, tsUrl))
    .then((response) => response.json())
    .then((data) => {
       // console.log(data);
       setTsData(data.data);
    })
    .catch((err) => {
       console.log(err.message);
    });
  }, [currts, offset, limit]);

  return (
    <>
      <div className="flex justify-start items-center w-full">
        <div className='bg-slate-700'>
          <div className='flex justify-between p-2'>
            <div className='flex items-center justify-center text-l font-bold'>
            Datasets
            </div>
            <div className='flex justify-items-end'>
              <Button color="white" variant="outlined"  size="small" onClick={handleOpen}>Add</Button>
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
              <RichTreeView
                multiSelect
                items={makeTreeItems(datasets)}
                checkboxSelection
                selectedItems={selectedItems}
                expandedItems={expandedItems}
                onExpandedItemsChange={handleExpandedItemsChange}
                onSelectedItemsChange={onTreeClick}/>
            </Box>
          </div>
        </div>

        <div className='w-full'>
          <div className='p-5' style={chartDivStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tsdata} >
                <XAxis dataKey="timestamp" angle={45} height={75}/>
                <YAxis/>
                {currts.map((ts, i) => <Line dataKey={`data.${ts}`} key={i} dot={false} stroke={COLORS[i % 8]}/>)}
              </LineChart>
            </ResponsiveContainer>
          </div>

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
                onChange={e => setOffset(e.target.value)}/>
            </label>
            <label> Limit:
              <input name="limitInput" defaultValue={limit} value={limit}
              onChange={e => setLimit(e.target.value)}/>
            </label>

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
