import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Switch,
  Upload,
  message,
  Select,
  InputNumber,
  DatePicker,
  AutoComplete,
  Tree,
} from "antd";
import { connect } from "react-redux";
import { Editor } from "@tinymce/tinymce-react";
import dayjs from "dayjs";

//Components
import PageTitle from "../../../Components/PageTitle";
import { InboxOutlined } from "@ant-design/icons";
import Loader from "../../../Components/Generals/Loader";

//Actions
import { tinymceAddPhoto } from "../../../redux/actions/imageActions";
import {
  loadSetProductCategories,
  clear as clearCat,
} from "../../../redux/actions/setofCategoriesActions";

import { loadTireMake } from "../../../redux/actions/tireMakeActions";
import { loadTireModal } from "../../../redux/actions/tireModalActions";
import * as actions from "../../../redux/actions/setOfActions";

// Lib
import base from "../../../base";
import axios from "../../../axios-base";
import { toastControl } from "src/lib/toasControl";
import { convertFromdata } from "../../../lib/handleFunction";
import { menuGenerateData } from "../../../lib/menuGenerate";

const requiredRule = {
  required: true,
  message: "Тус талбарыг заавал бөглөнө үү",
};

const { Dragger } = Upload;

const Add = (props) => {
  const [form] = Form.useForm();
  const [pictures, setPictures] = useState([]);
  const [deleteFiles, setDeleteFiles] = useState([]);
  const [choiseDate, setChoiseDate] = useState();
  const [autoComplete, setAutoComplete] = useState(null);
  const [gData, setGData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [autoWheelComplete, setAutoWheelComplete] = useState(null);
  const [checkedRadio, setCheckedRadio] = useState({
    status: true,
    star: false,
    isDiscount: false,
  });

  const [setProgress] = useState(0);
  const [loading, setLoading] = useState({
    visible: false,
    message: "",
  });

  // FUNCTIONS
  const init = () => {
    props.loadTireMake();
    props.loadTireModal();
    props.loadSetProductCategories();
    props.getSetproduct(props.match.params.id);
  };

  const clear = () => {
    props.clear();
    form.resetFields();
    setPictures([]);
    props.clearCat();
    setGData([]);
    setExpandedKeys([]);
    setSelectedKeys([]);
    setCheckedKeys([]);
    setLoading(false);
  };

  const handleChange = (event) => {
    form.setFieldsValue({ details: event });
  };

  const handleEdit = (values, status = null) => {
    if (pictures.length > 0) {
      values.pictures = pictures.map((el) => el.name);
    } else {
      values.pictures = [];
    }

    if (deleteFiles && deleteFiles.length > 0) {
      deleteFiles.map(async (deleteFile) => {
        await axios.delete("/imgupload", { data: { file: deleteFile } });
      });
    }

    const data = {
      ...values,
      star: values.star || false,
      isDiscount: values.isDiscount || false,
      setProductCategories: [...checkedKeys],
    };

    if (data.setProductCategories.length === 0) {
      data.setProductCategories = "";
    }

    data.year = choiseDate;
    if (status === "draft") {
      data.status = false;
    }

    const sendData = convertFromdata(data);

    props.updateSetproduct(props.match.params.id, sendData);
  };

  const handleDate = (date, dateString) => {
    setChoiseDate(dateString);
  };

  const handleRemove = (stType, file) => {
    let index;
    let deleteFile;
    let list;

    index = pictures.indexOf(file);
    deleteFile = pictures[index].name;
    list = pictures.slice();
    list.splice(index, 1);
    setPictures(list);

    setDeleteFiles((bf) => [...bf, deleteFile]);
  };

  // CONFIGS

  const uploadImage = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;
    const fmData = new FormData();
    const config = {
      headers: { "content-type": "multipart/form-data" },
      onUploadProgress: (event) => {
        const percent = Math.floor((event.loaded / event.total) * 100);
        setProgress(percent);
        if (percent === 100) {
          setTimeout(() => setProgress(0), 1000);
        }
        onProgress({ percent: (event.loaded / event.total) * 100 });
      },
    };

    fmData.append("file", file);
    try {
      const res = await axios.post("/imgupload", fmData, config);
      const img = {
        name: res.data.data,
        url: `${base.cdnUrl}${res.data.data}`,
      };
      setPictures((bfPicture) => [...bfPicture, img]);
      onSuccess("Ok");
      message.success(res.data.data + " Хуулагдлаа");
      return img;
    } catch (err) {
      toastControl("error", err);
      onError({ err });
      return false;
    }
  };

  const uploadOptions = {
    onRemove: (file) => handleRemove("pictures", file),
    fileList: [...pictures],
    customRequest: uploadImage,
    accept: "image/*",
    name: "picture",
    multiple: true,
    listType: "picture",
  };

  // -- TREE FUNCTIONS
  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onCheck = (checkedKeysValue) => {
    // console.log(checkedKeysValue);
    setCheckedKeys(checkedKeysValue);
  };

  const onSelect = (selectedKeysValue, info) => {
    // console.log("onSelect", info);
    setSelectedKeys(selectedKeysValue);
  };

  // USEEFFECT
  useEffect(() => {
    init();
    const fetchData = async () => {
      const result = await axios.get("/tires/groups");
      const resultWheel = await axios.get("/wheels/groups");
      if (result && result.data) {
        setAutoComplete(() => ({ ...result.data }));
      } else if (result && result.error) {
        toastControl("error", result.error);
      }

      if (resultWheel && resultWheel.data) {
        setAutoWheelComplete(() => ({ ...resultWheel.data }));
      } else if (result && result.error) {
        toastControl("error", result.error);
      }
    };

    fetchData().catch((err) => console.log(err));

    return () => clear();
  }, []);

  // Ямар нэгэн алдаа эсвэл амжилттай үйлдэл хийгдвэл энд useEffect барьж аваад TOAST харуулна
  useEffect(() => {
    toastControl("error", props.error);
  }, [props.error]);

  useEffect(() => {
    if (props.success) {
      toastControl("success", props.success);
      setTimeout(() => props.history.replace("/set"), 2000);
    }
  }, [props.success]);

  useEffect(() => {
    if (props.setProduct) {
      if (props.setProduct.tire) {
        props.setProduct.tiremake =
          props.setProduct.tire.make && props.setProduct.tire.make._id;
        props.setProduct.tiremodal =
          props.setProduct.tire.modal && props.setProduct.tire.modal._id;
        props.setProduct.tirewidth = props.setProduct.tire.width;
        props.setProduct.tireheight = props.setProduct.tire.height;
        props.setProduct.tirediameter = props.setProduct.tire.diameter;
        props.setProduct.tireuse = props.setProduct.tire.use;
        props.setProduct.tireseason = props.setProduct.tire.season;
      }

      if (props.setProduct.wheel) {
        props.setProduct.wheelwidth = props.setProduct.wheel.width;
        props.setProduct.wheeldiameter = props.setProduct.wheel.diameter;
        props.setProduct.wheelboltPattern = props.setProduct.wheel.boltPattern;
        props.setProduct.wheelrim = props.setProduct.wheel.rim;
        props.setProduct.wheelthreadSize = props.setProduct.wheel.threadSize;
        props.setProduct.wheelcenterBore = props.setProduct.wheel.centerBore;
      }

      form.setFieldsValue({ ...props.setProduct });
      setCheckedRadio({
        status: props.setProduct.status,
        star: props.setProduct.star,
        isDiscount: props.setProduct.isDiscount,
        isNew: props.setProduct.isNew,
      });

      if (
        props.setProduct.setProductCategories &&
        props.setProduct.setProductCategories.length > 0
      ) {
        setCheckedKeys(() => {
          return props.setProduct.setProductCategories.map(
            (cat) => cat && cat._id && cat._id
          );
        });
      }

      props.setProduct.pictures &&
        props.setProduct.pictures.length > 0 &&
        setPictures(
          props.setProduct.pictures.map((img) => ({
            name: img,
            url: `${base.cdnUrl}${img}`,
          }))
        );
    }
  }, [props.setProduct]);

  useEffect(() => {
    const data = menuGenerateData(props.categories);
    setGData(data);
  }, [props.categories]);

  return (
    <>
      <div className="content-wrapper">
        <PageTitle name="Дугуй шинэчлэх" />
        <div className="page-sub-menu"></div>
        <div className="content">
          <Loader show={loading.visible}> {loading.message} </Loader>
          <div className="container-fluid">
            <Form layout="vertical" form={form}>
              <div className="row">
                <div className="col-8">
                  <div className="card card-primary">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <Form.Item
                            label=" код"
                            name="setofCode"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <Input placeholder="Дугуй,обудудын код оруулна уу" />
                          </Form.Item>
                        </div>
                        <div className="col-6">
                          <Form.Item
                            label="Дугуй,обудудын арын тоон код"
                            name="code"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <Input placeholder="Дугуй,обудудын арын тоон код оруулна уу" />
                          </Form.Item>
                        </div>
                        <div className="col-12">
                          <Form.Item
                            label="Гарчиг"
                            name="name"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <Input placeholder="Гарчиг оруулна уу" />
                          </Form.Item>
                        </div>
                        <div className="col-12">
                          <Form.Item
                            label="Үнэ"
                            name="price"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <InputNumber
                              style={{ width: "100%" }}
                              placeholder="Үнэ оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        {checkedRadio.isDiscount === true && (
                          <div className="col-12">
                            <Form.Item
                              label="Хямдарсан үнэ"
                              name="discount"
                              rules={[requiredRule]}
                              hasFeedback
                            >
                              <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Хямдарсан үнэ оруулна уу"
                              />
                            </Form.Item>
                          </div>
                        )}
                        <div className="col-12">
                          <Form.Item
                            label="Багц"
                            name="setOf"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <InputNumber
                              style={{ width: "100%" }}
                              placeholder="Багц оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-12" style={{ margin: "15px 0px" }}>
                          <h6> Дугуйны мэдээлэл</h6>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Үйлдвэрлэгч"
                            name="tiremake"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <Select
                              options={
                                props.tiremakes &&
                                props.tiremakes.map((make) => {
                                  return {
                                    value: make._id,
                                    label: make.name,
                                  };
                                })
                              }
                              placeholder="Үйлдвэрлэгчидээс сонгох"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Загвар"
                            name="tiremodal"
                            hasFeedback
                          >
                            <Select
                              options={
                                props.tiremodals &&
                                props.tiremodals.map((modal) => {
                                  return {
                                    value: modal._id,
                                    label: modal.name,
                                  };
                                })
                              }
                              placeholder="Загвараас сонгох"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Өргөн"
                            name="tirewidth"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              style={{ width: "100%" }}
                              options={
                                autoComplete &&
                                autoComplete["width"] &&
                                autoComplete["width"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Өргөн оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Хажуугийн талын хэмжээ"
                            name="tireheight"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              style={{ width: "100%" }}
                              options={
                                autoComplete &&
                                autoComplete["height"] &&
                                autoComplete["height"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Хажуугийн талын хэмжээ оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Диаметрын хэмжээ"
                            name="tirediameter"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              options={
                                autoComplete &&
                                autoComplete["diameter"] &&
                                autoComplete["diameter"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              style={{ width: "100%" }}
                              placeholder="Диаметрын хэмжээ оруулна уу"
                            />
                          </Form.Item>
                        </div>

                        <div className="col-4">
                          <Form.Item
                            label="Ашиглалтын хувь"
                            name="tireuse"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <InputNumber
                              style={{ width: "100%" }}
                              placeholder="Ашиглалтын хувь оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Улилрал"
                            name="tireseason"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <Select
                              options={[
                                {
                                  value: "summer",
                                  label: "Зуны",
                                },
                                {
                                  value: "winter",
                                  label: "Өвлийн",
                                },
                                {
                                  value: "allin",
                                  label: "4 Улилралын",
                                },
                              ]}
                              placeholder="Загвараас сонгох"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-12" style={{ margin: "15px 0px" }}>
                          <h6> Обудын мэдээлэл </h6>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Обудын диаметр"
                            name="wheeldiameter"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              style={{ width: "100%" }}
                              options={
                                autoWheelComplete &&
                                autoWheelComplete["diameter"] &&
                                autoWheelComplete["diameter"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Диаметрын хэмжээг оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Өргөн (J) оруулна уу"
                            name="wheelwidth"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              style={{ width: "100%" }}
                              options={
                                autoWheelComplete &&
                                autoWheelComplete["width"] &&
                                autoWheelComplete["width"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Өндрийг оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Болтны хоорондын зайны хэмжээ"
                            name="wheelboltPattern"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              options={
                                autoWheelComplete &&
                                autoWheelComplete["boltPattern"] &&
                                autoWheelComplete["boltPattern"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Болтны хоорондын зайны  хэмжээг оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Rim хэмжээ"
                            name="wheelrim"
                            rules={[requiredRule]}
                            hasFeedback
                          >
                            <AutoComplete
                              options={
                                autoWheelComplete &&
                                autoWheelComplete["rim"] &&
                                autoWheelComplete["rim"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Rim хэмжээг оруулна уу"
                            />
                          </Form.Item>
                        </div>

                        <div className="col-4">
                          <Form.Item
                            label="Болтны хэмжээ"
                            name="wheelthreadSize"
                            hasFeedback
                          >
                            <AutoComplete
                              options={
                                autoWheelComplete &&
                                autoWheelComplete["threadSize"] &&
                                autoWheelComplete["threadSize"].map((el) => ({
                                  value: el.name,
                                }))
                              }
                              placeholder="Болтны нүхний хэмжээг оруулна уу"
                            />
                          </Form.Item>
                        </div>
                        <div className="col-4">
                          <Form.Item
                            label="Обудын голын диаметрын хэмжээ"
                            name="wheelcenterBore"
                            hasFeedback
                          >
                            <Input placeholder="Обудын голын диаметрын хэмжээг оруулна уу" />
                          </Form.Item>
                        </div>

                        <div className="col-12">
                          <Form.Item
                            label="Дэлгэрэнгүй"
                            name="details"
                            getValueFromEvent={(e) =>
                              e.target && e.target.getContent()
                            }
                            rules={[requiredRule]}
                          >
                            <Editor
                              apiKey="2nubq7tdhudthiy6wfb88xgs36os4z3f4tbtscdayg10vo1o"
                              init={{
                                height: 300,
                                menubar: false,
                                plugins: [
                                  "advlist textcolor autolink lists link image charmap print preview anchor tinydrive ",
                                  "searchreplace visualblocks code fullscreen",
                                  "insertdatetime media table paste code help wordcount image media  code  table  ",
                                ],
                                toolbar:
                                  "mybutton | addPdf |  image | undo redo | fontselect fontsizeselect formatselect blockquote  | bold italic forecolor  backcolor | \
                        alignleft aligncenter alignright alignjustify | \
                        bullist numlist outdent indent | removeformat | help | link  | quickbars | media | code | tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",
                                file_picker_types: "image",
                                tinydrive_token_provider: `${base.apiUrl}users/jwt`,
                                automatic_uploads: false,
                                setup: (editor) => {
                                  editor.ui.registry.addButton("mybutton", {
                                    text: "Файл оруулах",
                                    onAction: () => {
                                      var input =
                                        document.createElement("input");
                                      input.setAttribute("type", "file");
                                      input.onchange = async function () {
                                        var file = this.files[0];
                                        const fData = new FormData();
                                        fData.append("file", file);
                                        setLoading({
                                          visible: true,
                                          message:
                                            "Түр хүлээнэ үү файл хуулж байна",
                                        });
                                        const res = await axios.post(
                                          "/file",
                                          fData
                                        );
                                        const url =
                                          `${base.cdnUrl}` + res.data.data;
                                        editor.insertContent(
                                          `<a href="${url}"> ${res.data.data} </a>`
                                        );
                                        setLoading({
                                          visible: false,
                                        });
                                      };
                                      input.click();
                                    },
                                  });
                                  editor.ui.registry.addButton("addPdf", {
                                    text: "PDF Файл оруулах",
                                    onAction: () => {
                                      let input =
                                        document.createElement("input");
                                      input.setAttribute("type", "file");
                                      input.setAttribute("accept", ".pdf");
                                      input.onchange = async function () {
                                        let file = this.files[0];
                                        const fData = new FormData();
                                        fData.append("file", file);
                                        setLoading({
                                          visible: true,
                                          message:
                                            "Түр хүлээнэ үү файл хуулж байна",
                                        });
                                        const res = await axios.post(
                                          "/file",
                                          fData
                                        );
                                        const url = base.cdnUrl + res.data.data;
                                        editor.insertContent(
                                          `<iframe src="${url}" style="width:100%; min-height: 500px"> </iframe>`
                                        );
                                        setLoading({
                                          visible: false,
                                        });
                                      };
                                      input.click();
                                    },
                                  });
                                },
                                file_picker_callback: function (
                                  cb,
                                  value,
                                  meta
                                ) {
                                  var input = document.createElement("input");
                                  input.setAttribute("type", "file");
                                  input.setAttribute("accept", "image/*");
                                  input.onchange = async function () {
                                    var file = this.files[0];
                                    const fData = new FormData();
                                    fData.append("file", file);
                                    const res = await axios.post(
                                      "/imgupload",
                                      fData
                                    );
                                    const url =
                                      `${base.cdnUrl}` + res.data.data;
                                    cb(url);
                                  };
                                  input.click();
                                },
                              }}
                              onEditorChange={(event) => handleChange(event)}
                            />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="card">
                    <div class="card-header">
                      <h3 class="card-title">ТОХИРГОО</h3>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-12">
                          <Form.Item label="Зарагдсан эсэх" name="status">
                            <Switch
                              checkedChildren="Зарагдаагүй"
                              unCheckedChildren="Зарагдсан"
                              size="medium"
                              defaultChecked
                              checked={checkedRadio.status}
                              onChange={(checked) =>
                                setCheckedRadio((bc) => ({
                                  ...bc,
                                  status: checked,
                                }))
                              }
                            />
                          </Form.Item>
                        </div>
                        <div className="col-12">
                          <Form.Item label="Онцлох" name="star">
                            <Switch
                              size="medium"
                              checked={checkedRadio.star}
                              onChange={(checked) =>
                                setCheckedRadio((bc) => ({
                                  ...bc,
                                  star: checked,
                                }))
                              }
                            />
                          </Form.Item>
                        </div>
                        <div className="col-12">
                          <Form.Item label="Хямдрал зарлах" name="isDiscount">
                            <Switch
                              size="medium"
                              checked={checkedRadio.isDiscount}
                              onChange={(checked) =>
                                setCheckedRadio((bc) => ({
                                  ...bc,
                                  isDiscount: checked,
                                }))
                              }
                            />
                          </Form.Item>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="control-bottons">
                        <Button
                          key="submit"
                          htmlType="submit"
                          className="add-button"
                          loading={props.loading}
                          onClick={() => {
                            form
                              .validateFields()
                              .then((values) => {
                                handleEdit(values);
                              })
                              .catch((info) => {
                                // console.log(info);
                              });
                          }}
                        >
                          Хадгалах
                        </Button>
                        <Button
                          key="draft"
                          type="primary"
                          onClick={() => {
                            form
                              .validateFields()
                              .then((values) => {
                                handleEdit(values, "draft");
                              })
                              .catch((info) => {
                                // console.log(info);
                              });
                          }}
                        >
                          Зарагдсан
                        </Button>
                        <Button onClick={() => props.history.goBack()}>
                          Буцах
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div class="card-header">
                      <h3 class="card-title">АНГИЛАЛ</h3>
                    </div>
                    <div className="card-body">
                      <Form.Item name="categories">
                        <Tree
                          checkable
                          onExpand={onExpand}
                          expandedKeys={expandedKeys}
                          autoExpandParent={autoExpandParent}
                          onCheck={onCheck}
                          checkedKeys={checkedKeys}
                          onSelect={onSelect}
                          selectedKeys={selectedKeys}
                          treeData={gData}
                        />
                      </Form.Item>
                    </div>
                  </div>
                  <div className="card">
                    <div class="card-header">
                      <h3 class="card-title">Зураг оруулах</h3>
                    </div>
                    <div className="card-body">
                      <Dragger
                        {...uploadOptions}
                        className="upload-list-inline"
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Зургаа энэ хэсэг рүү чирч оруулна уу
                        </p>
                        <p className="ant-upload-hint">
                          Нэг болон түүнээс дээш файл хуулах боломжтой
                        </p>
                      </Dragger>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    success: state.setOfReducer.success,
    error: state.setOfReducer.error,
    loading: state.setOfReducer.loading,
    tiremakes: state.tireMakeReducer.tiremakes,
    tiremodals: state.tireModalReducer.tiremodals,
    setProduct: state.setOfReducer.setProduct,
    categories: state.setofCategoryReducer.categories,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tinymceAddPhoto: (file) => dispatch(tinymceAddPhoto(file)),
    loadTireMake: () => dispatch(loadTireMake()),
    loadTireModal: () => dispatch(loadTireModal()),
    loadSetProductCategories: () => dispatch(loadSetProductCategories()),
    updateSetproduct: (id, data) =>
      dispatch(actions.updateSetproduct(id, data)),
    getSetproduct: (id) => dispatch(actions.getSetproduct(id)),
    clear: () => dispatch(actions.clear()),
    clearCat: () => dispatch(clearCat()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Add);
