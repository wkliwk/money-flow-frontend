import React, { useState } from 'react';
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';
import { ExpenseResponse } from '../../types'; // Import the API service

interface TableWrapperProps {
  data: ExpenseResponse[];
}

const columns: GridColDef[] = [
  { field: 'expenseId', headerName: 'ID', flex: 1 },
  { field: 'owner', headerName: 'Owner', flex: 1 },
  { field: 'amount', headerName: 'Amount', type: 'number', flex: 1 },
  { field: 'purpose', headerName: 'Purpose', flex: 1 },
  { field: 'currentLocation', headerName: 'Current Location', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 2 },
  { field: 'type', headerName: 'Type', flex: 1 },
  { field: 'duration', headerName: 'Duration', flex: 1 },
  { field: 'parent', headerName: 'Parent', flex: 1 },
  { field: 'status', headerName: 'Status', flex: 1 },
  { field: 'profit', headerName: 'Profit', type: 'number', flex: 1 },
  { field: 'startDate', headerName: 'Start Date', type: 'date', flex: 1 },
  { field: 'endDate', headerName: 'End Date', type: 'date', flex: 1 },
];

const TableWrapper: React.FC<TableWrapperProps> = ({ data }) => {
  const [sortModel, setSortModel] = useState<GridSortModel>([
    {
      field: 'expenseId',
      sort: 'desc', // Default sorting
    },
  ]);

  const handleSortModelChange = (newSortModel: GridSortModel) => {
    setSortModel(newSortModel);
  };

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
      />
    </div>
  );
};

export default TableWrapper;
