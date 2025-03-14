import { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { TreeItem2, TreeItem2Props } from '@mui/x-tree-view/TreeItem2';
import { useTreeItem2Utils } from '@mui/x-tree-view/hooks';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { dataSet } from '../types/dataset';

interface DatasetPanelProps {
  datasets: dataSet[];
  currentDataset: dataSet | undefined;
  selectedDsetIndex: number;
  selectedItems: string[];
  expandedItems: string[];
  onDatasetClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => void;
  onTreeClick: (event: React.SyntheticEvent, itemIds: string[]) => void;
  handleExpandedItemsChange: (event: React.SyntheticEvent, itemIds: string[]) => void;
  handleOpenAdd: () => void;
  handleOpenImport: () => void;
}

interface TypedTreeItem extends TreeViewBaseItem {
  nodeType: string; 
}

const catIds = new Set<string>(['ts_col_time', 'ts_col_series', 'ts_col_other']);

export function isPlottable(ds: dataSet | undefined, itemId: string): boolean {
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

export function DatasetPanel({
  datasets,
  currentDataset,
  selectedDsetIndex,
  selectedItems,
  expandedItems,
  onDatasetClick,
  onTreeClick,
  handleExpandedItemsChange,
  handleOpenAdd,
  handleOpenImport
}: DatasetPanelProps) {
  return (
    <div className='bg-slate-700'>
      <div className='flex justify-between p-2'>
        <div className='flex justify-center text-l font-bold'>
          Datasets
        </div>
        <div className='flex justify-items-end'>
          <Button variant="outlined" size="small" onClick={handleOpenAdd} sx={{margin: "2px 5px 2px 5px"}}>Add</Button>
          <Button variant="outlined" size="small" onClick={handleOpenImport} sx={{margin: "2px 5px 2px 5px"}}>Import</Button>
        </div>
      </div>
      <div>
        <Box sx={{
          minHeight: 600,
          minWidth: 250,
          maxHeight: 800,
          mb: 2,
          display: "flex",
          flexDirection: "column",
          height: 700,
          overflow: "hidden",
          overflowY: "scroll"
        }}>
          <List sx={{
            bgcolor: '#3C3C4C',
            '& .MuiListItemText-primary': {
              fontSize: '14px',
              fontWeight: 500
            }
          }}>
            {datasets.map((ds, idx) =>
              <ListItem disablePadding key={idx}>
                <ListItemButton onClick={(event) => {onDatasetClick(event, idx)}} selected={selectedDsetIndex === idx}>
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
  );
} 