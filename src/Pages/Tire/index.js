import React, { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Button, Modal, Input, Select, Table, Tag, Space, Tooltip } from "antd";
import { connect } from "react-redux";
import Highlighter from "react-highlight-words";
import moment from "moment";
import * as XLSX from "xlsx";
import { SearchOutlined } from "@ant-design/icons";

//Lib
import base from "../../base";

//Components
import PageTitle from "../../Components/PageTitle";
import Menus from "./menu";
import axios from "../../axios-base";
import { toastControl } from "../../lib/toasControl";
import Loader from "../../Components/Generals/Loader";

// Actions
import * as actions from "../../redux/actions/tireActions";

const Tire = (props) => {
  const searchInput = useRef(null);
  //STATES
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [loading, setLoading] = useState({
    visible: false,
    message: "",
  });
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  // -- FILTER STATE
  const [querys, setQuerys] = useState({});
  const [filterdColumns, setFilterdColumns] = useState([]);
  // -- TABLE STATE
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
    },
  });

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          ref={searchInput}
          placeholder={`Хайлт хийх`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Хайх
          </Button>
          <Button
            onClick={() => handleReset(clearFilters, selectedKeys, dataIndex)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Шинчлэх
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1890ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const [columns, setColumns] = useState([
    {
      dataIndex: "tireCode",
      key: "tireCode",
      title: "Код",
      status: true,
      ...getColumnSearchProps("tireCode"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "status",
      key: "status",
      title: "Төлөв",
      status: true,

      filters: [
        {
          text: "Зарагдаагүй",
          value: "true",
        },
        {
          text: "Зарагдсан",
          value: "false",
        },
      ],
      sorter: (a, b) => handleSort(),
    },

    {
      dataIndex: "name",
      key: "name",
      title: "Гарчиг",
      status: true,
      ...getColumnSearchProps("name"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "tireCategories",
      key: "tireCategories",
      title: "Ангилал",
      status: true,
      filters:
        props.tireCategories &&
        props.tireCategories.map((cat) => ({
          text: cat.name,
          value: cat._id,
        })),
      render: (text, record) => {
        return record.tireCategories.map((el) => (
          <Tag color="blue"> {el} </Tag>
        ));
      },
    },
    {
      dataIndex: "make",
      key: "make",
      title: "Үйлдвэрлэгч",
      status: true,
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "modal",
      key: "modal",
      title: "Загвар",
      status: false,
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "width",
      key: "width",
      title: "Өргөн",
      status: true,
      ...getColumnSearchProps("width"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "height",
      key: "height",
      title: "Хажуу талын хэмжээ",
      status: true,
      ...getColumnSearchProps("width"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "diameter",
      key: "diameter",
      title: "Диаметр",
      status: true,
      ...getColumnSearchProps("diameter"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "year",
      key: "year",
      title: "Үйлдвэрлэгдсэн огноо",
      status: false,
      ...getColumnSearchProps("year"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "use",
      key: "use",
      title: "Ашиглалтын хувь",
      status: false,
      ...getColumnSearchProps("use"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "season",
      key: "season",
      title: "Улилрал",
      status: false,
      ...getColumnSearchProps("season"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "pictures",
      key: "pictures",
      title: "Зураг",
      status: true,
      render: (text, record) => {
        // console.log(record);
        return (
          <div className="table-image">
            {record.pictures && record.pictures.length > 0 ? (
              <img src={`${base.cdnUrl}150x150/${record.pictures[0]}`} />
            ) : (
              "Зураг оруулаагүй байна"
            )}
          </div>
        );
      },
    },
    {
      dataIndex: "price",
      key: "price",
      title: "Үнэ",
      status: true,
      ...getColumnSearchProps("price"),
      sorter: (a, b) => handleSort(),
    },

    {
      dataIndex: "discount",
      key: "discount",
      title: "Хөнгөлөлт",
      status: true,
      ...getColumnSearchProps("discount"),
      sorter: (a, b) => handleSort(),
    },

    {
      dataIndex: "setOf",
      key: "setOf",
      title: "Багц",
      status: true,
      ...getColumnSearchProps("setOf"),
      sorter: (a, b) => handleSort(),
    },

    {
      dataIndex: "views",
      key: "views",
      title: "Нийт үзсэн",
      status: true,
      ...getColumnSearchProps("views"),
      sorter: (a, b) => handleSort(),
    },

    {
      dataIndex: "createUser",
      key: "createUser",
      title: "Бүртгэсэн",
      status: true,
      ...getColumnSearchProps("createUser"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "updateUser",
      key: "updateUser",
      title: "Өөрчлөлт хийсэн",
      status: false,
      ...getColumnSearchProps("updateUser"),
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "createAt",
      key: "createAt",
      title: "Үүсгэсэн огноо",
      status: true,
      sorter: (a, b) => handleSort(),
    },
    {
      dataIndex: "updateAt",
      key: "updateAt",
      title: "Өөрчлөлт хийсэн огноо",
      status: false,
      sorter: (a, b) => handleSort(),
    },
  ]);

  const [cloneColumns, setCloneColumns] = useState(columns);

  const handleEdit = () => {
    if (selectedRowKeys.length != 1) {
      toastControl("error", "Нэг өгөгдөл сонгоно уу");
    } else {
      history.push(`/tire/edit/${selectedRowKeys[0]}`);
    }
  };

  const handleDelete = () => {
    props.deleteMultTire(selectedRowKeys);
  };

  // -- MODAL STATE
  const [visible, setVisible] = useState({
    delete: false,
    column: false,
  });

  // -- TOAST CONTROL SUCCESS AND ERROR
  useEffect(() => {
    if (props.error) {
      toastControl("error", props.error);
      props.clear();
    }
    if (error) {
      toastControl("error", error);
      props.clear();
    }
  }, [props.error, error]);

  useEffect(() => {
    if (props.success !== null) {
      toastControl("success", props.success);
      handleCancel();
      props.clear();
      setSelectedRowKeys([]);
      init();
    }
  }, [props.success]);

  // QUERY CHANGES AND FEATCH DATA
  useEffect(() => {
    if (querys) {
      const query = queryBuild();
      props.loadTire(query);
    }
  }, [querys]);

  // -- SEARCH FILTER AND COLUMNS
  useEffect(() => {
    setFilterdColumns(columns.filter((col) => col.status === true));
  }, [columns]);

  useEffect(() => {
    const select = [];
    select.push(filterdColumns.map((col) => col.dataIndex));
    setQuerys((bquery) => ({ ...bquery, select: select }));
  }, [filterdColumns]);

  // -- LOADING
  useEffect(() => {
    setLoading({ visible: props.loading, message: "Түр хүлээнэ үү" });
  }, [props.loading]);

  // -- NEWS GET DONE EFFECT
  useEffect(() => {
    if (props.tires) {
      const refData = [];

      props.tires.length > 0 &&
        props.tires.map((el) => {
          const key = el._id;
          delete el._id;
          el.status = el.status == true ? "Зарагдаагүй" : "Зарагдсан";

          el.createUser = el.createUser && el.createUser.firstName;
          el.updateUser = el.updateUser && el.updateUser.firstName;
          el.createAt = moment(el.createAt)
            .utcOffset("+0800")
            .format("YYYY-MM-DD HH:mm:ss");
          el.updateAt = moment(el.updateAt)
            .utcOffset("+0800")
            .format("YYYY-MM-DD HH:mm:ss");
          el.price = new Intl.NumberFormat().format(el.price) + "₮";
          el.discount = new Intl.NumberFormat().format(el.discount) + "₮";
          el.make = el.make && el.make.name;
          el.modal = el.modal && el.modal.name;
          el.tireCategories = el.tireCategories.map((el) => el.name);
          refData.push({
            dataIndex: key,
            key,
            ...el,
          });
        });

      // console.log(refData);
      setData(refData);
    }
  }, [props.tires]);

  // Start moment
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const total = props.pagination.total;
    const pageSize = props.pagination.limit;

    setTableParams((tbf) => ({
      ...tbf,
      pagination: { ...tbf.pagination, total, pageSize },
    }));
  }, [props.pagination]);

  // -- INIT
  const init = () => {
    const query = queryBuild();
    props.loadTire(`${query}`);
  };

  const clear = () => {};

  // -- HANDLE FUNCTIONS

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
    setQuerys((bquerys) => ({ ...bquerys, [dataIndex]: selectedKeys[0] }));
  };

  const handleReset = (clearFilters, selectedKeys, dataIndex) => {
    clearFilters();
    setQuerys((bquery) => ({ ...bquery, [dataIndex]: "" }));
    setSearchText("");
  };

  const handleSort = () => {};

  // -- TABLE SELECTED AND CHANGE

  const handleColumn = (e) => {
    const newArr = [...cloneColumns];
    const checkElmt = newArr.findIndex((col) => col.key == e.target.name);
    const toggle = newArr[checkElmt].status === true ? false : true;
    newArr[checkElmt] = { ...newArr[checkElmt], status: toggle };
    setCloneColumns(() => [...newArr]);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });

    if (pagination) {
      setQuerys((bq) => ({
        ...bq,
        page: pagination.current,
        limit: pagination.pageSize,
      }));
    }

    if (sorter) {
      const clkey = sorter.columnKey;
      setQuerys((bquery) => ({
        ...bquery,
        sort: `${clkey + ":" + sorter.order}`,
      }));
    } else {
      setQuerys((bquery) => {
        delete bquery.sort;
        return { ...bquery };
      });
    }

    if (filters) {
      // console.log("end");
      Object.keys(filters).map((key) => {
        let str = null;
        if (filters[key]) {
          str = filters[key].toString();
          setQuerys((bq) => ({ ...bq, [key]: str }));
        } else {
          setQuerys((bq) => {
            delete bq[key];
            return { ...bq };
          });
        }
      });
      //
    }
  };

  // Repeat functions
  const queryBuild = () => {
    let query = "";
    Object.keys(querys).map((key) => {
      key !== "select" && (query += `${key}=${querys[key]}&`);
    });
    if (querys.select && querys.select[0])
      query += `select=${
        querys &&
        querys.select &&
        querys.select[0].join(" ").replaceAll(",", " ")
      }`;
    return query;
  };

  // -- MODAL SHOW AND CLOSE
  const showModal = (modal) => {
    switch (modal) {
      case "delete": {
        if (selectedRowKeys && selectedRowKeys.length > 0) {
          setVisible((sb) => ({ ...sb, [modal]: true }));
        } else {
          toastControl("error", "Өгөгдөл сонгоно уу");
        }
        break;
      }
      case "edit": {
        if (selectedRowKeys && selectedRowKeys.length === 1) {
          props.history.replace("/tire/edit/" + selectedRowKeys[0]);
        } else {
          toastControl("error", "Нэг өгөгдөл сонгоно уу");
        }
        break;
      }
      default: {
        setVisible((sb) => ({ ...sb, [modal]: true }));
        break;
      }
    }
  };

  const handleCancel = () => {
    setVisible((sb) => Object.keys(sb).map((el) => (sb[el] = false)));
    clear();
  };

  // -- ROW SELECT FUNCTIONS
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // -- PLUS FUNCTION REFRESH, TO EXCEL, COLUMN
  const refreshTable = () => {
    props.clear();
    setQuerys((bqr) => ({ select: bqr["select"] }));
    setTableParams(() => ({
      ...{
        pagination: {
          current: 1,
        },
      },
    }));
    setSearchText(() => "");
    setSearchedColumn("");
    init();
  };

  // -- CONVER JSON  TO EXCEL
  const exportExcel = async () => {
    const query = queryBuild();
    const response = await axios.get("tire/excel?" + query);
    let excelData = [];
    if (response) {
      const data = response.data.data;
      excelData = data.map((el) => {
        cloneColumns.map((col) => {
          const keys = Object.keys(el);
          keys.map(
            (key) => col.key === key && col.status === false && delete el[key]
          );

          if (col.key === "status" && col.status === true) {
            el.status =
              el.status && el.status == true ? "Нийтлэгдсэн" : "Ноорог";
          }

          if (col.key === "createUser" && col.status === true) {
            el.createUser = el.createUser && el.createUser.firstName;
          }
          if (col.key === "updateUser" && col.status === true) {
            el.updateUser = el.updateUser && el.updateUser.firstName;
          }

          if (col.key === "pictures" && col.pictures === true) {
            el.pictures = el.pictures && base.cdnUrl + el.pictures[0];
          }
          if (col.key === "createAt" && col.status === true) {
            el.createAt = moment(el.createAt)
              .utcOffset("+0800")
              .format("YYYY-MM-DD HH:mm:ss");
          }
          if (col.key === "updateAt" && col.status === true) {
            el.updateAt = moment(el.updateAt)
              .utcOffset("+0800")
              .format("YYYY-MM-DD HH:mm:ss");
          }
        });

        return el;
      });
    }
    const head = [];
    cloneColumns.map((col) => {
      if (col.status === true) head.push(col.title);
    });
    const Header = [["id", ...head]];
    setLoading({
      visible: true,
      message: "Түр хүлээнэ үү excel файлруу хөрвүүлж байна",
    });
    if (excelData && excelData.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      const date = new Date().toLocaleDateString();
      XLSX.utils.sheet_add_aoa(worksheet, Header);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      XLSX.writeFile(workbook, `${date}.xlsx`);
    }
    setLoading({
      visible: false,
      message: "",
    });
  };

  const history = useHistory();

  return (
    <>
      <div className="content-wrapper">
        <PageTitle name="Дугуй" />
        <div className="page-sub-menu">
          <Menus />
        </div>
        <div className="content">
          <Loader show={loading.visible}> {loading.message}</Loader>
          <div className="container-fluid">
            <div className="card datatable-card">
              <div className="card-header">
                <h3 className="card-title">Бүх дугуй</h3>
              </div>
              <div className="card-body datatable-card-body">
                <div className="datatable-header-tools">
                  <div className="datatable-actions">
                    <button
                      className="datatable-action add-bg"
                      onClick={() => history.push(`/tire/add`)}
                    >
                      <i className="fa fa-plus"></i> Нэмэх
                    </button>
                    <button
                      className="datatable-action edit-bg"
                      onClick={() => handleEdit()}
                    >
                      <i className="fa fa-edit"></i> Засах
                    </button>
                    <button
                      className="datatable-action delete-bg"
                      onClick={() => showModal("delete")}
                    >
                      <i className="fa fa-trash"></i> Устгах
                    </button>
                  </div>
                  <div className="datatable-tools">
                    <Tooltip placement="left" title="Шинчлэх">
                      <button
                        className="datatable-tool"
                        onClick={() => refreshTable()}
                      >
                        <i className="fas fa-redo"></i>
                      </button>
                    </Tooltip>
                    <Tooltip placement="left" title="Excel файл болгон татах">
                      <button
                        className="datatable-tool"
                        onClick={() => exportExcel()}
                      >
                        <i className="far fa-file-excel"></i>
                      </button>
                    </Tooltip>
                    <Tooltip placement="left" title="Баганын тохиргоо">
                      <button
                        className="datatable-tool"
                        onClick={() => showModal("column")}
                      >
                        <i className="fas fa-columns"></i>
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="tableBox">
                  <Table
                    rowSelection={rowSelection}
                    columns={filterdColumns}
                    dataSource={data}
                    onChange={handleTableChange}
                    pagination={tableParams.pagination}
                    loading={props.loading}
                    size="small"
                  />
                </div>
                <div className="talbeFooter">
                  Нийт <b> {props.pagination.total} </b> өгөгдөл байна
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal col */}

      <Modal
        visible={visible && visible.column}
        title="Тохиргоо"
        onCancel={() => handleCancel()}
        footer={[
          <Button key="back" onClick={() => handleCancel()}>
            Буцах
          </Button>,
          <Button
            key="submit"
            htmlType="submit"
            type="primary"
            loading={loading.visible}
            onClick={() => setColumns(cloneColumns)}
          >
            Хадгалах
          </Button>,
        ]}
      >
        <div className="tableBox">
          <table className="custom-table">
            <tr>
              <th>№</th>
              <th>Нэр</th>
              <th>Харагдах эсэх</th>
            </tr>
            {cloneColumns.map((col, index) => (
              <tr>
                <td>{index + 1}</td>
                <td>{col.title}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={col.status}
                    name={col.key}
                    onChange={handleColumn.bind()}
                  />{" "}
                </td>
              </tr>
            ))}
          </table>
        </div>
      </Modal>

      {/* Delete modal */}
      {/* DELETE MODAL */}
      <Modal
        visible={visible && visible.delete}
        title="Устгах"
        onCancel={() => handleCancel()}
        footer={[
          <Button key="back" onClick={() => handleCancel()}>
            Буцах
          </Button>,
          <Button
            key="submit"
            htmlType="submit"
            type="danger"
            loading={loading.visible}
            onClick={() => handleDelete(cloneColumns)}
          >
            Устгах
          </Button>,
        ]}
      >
        <div className="tableBox">
          <p>
            {" "}
            Та нийт <b> {selectedRowKeys.length} </b> мэдээлэл сонгосон байна
            устгахдаа итгэлтэй байна уу? <br /> Хэрэв устгавал дахин сэргээх
            боломжгүйг анхаарна уу.{" "}
          </p>
        </div>
      </Modal>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    loading: state.tireReducer.loading,
    success: state.tireReducer.success,
    error: state.tireReducer.error,
    tires: state.tireReducer.tires,
    pagination: state.tireReducer.paginationLast,
  };
};

const mapDispatchToProp = (dispatch) => {
  return {
    saveTire: (data) => dispatch(actions.saveTire(data)),
    loadTire: (query) => dispatch(actions.loadTire(query)),
    deleteMultTire: (ids) => dispatch(actions.deleteMultTire(ids)),
    getExcelData: (query) => dispatch(actions.getExcelData(query)),
    clear: () => dispatch(actions.clear()),
  };
};

export default connect(mapStateToProps, mapDispatchToProp)(Tire);
