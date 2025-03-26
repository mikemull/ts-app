
export type opSet = {
    id: string
    dataset_id: string
    plot: string[]
    offset: number
    limit: number
  };
  
  
export type dataSet = {
    id: string
    name: string
    description: string
    series_cols: string[]
    timestamp_cols: string[]
    other_cols: string[]
    max_length: number
    ops: opSet[]
    opset: opSet
  };
