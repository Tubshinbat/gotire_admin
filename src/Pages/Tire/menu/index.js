import React, { useEffect, useState } from "react";
import { Menu } from "antd";
import { useHistory } from "react-router-dom";
//Hooks
import { usePathname } from "../../../hooks/use-url";

//Sub menu init data
const subItems = [
  {
    label: "Дугуй",
    key: "/tire",
  },
  {
    label: "Үйлдвэрлэгч",
    key: "/tire/make",
  },
  {
    label: "Загвар",
    key: "/tire/modal",
  },
  {
    label: "Ангилал",
    key: "/tire/categories",
  },
];

const Index = () => {
  const pathname = usePathname();
  const [current, setCurrent] = useState(pathname);
  const history = useHistory();
  const handleClick = (el) => {
    history.push(el.key);
  };

  useEffect(() => {
    setCurrent(pathname);
  }, [pathname]);

  return (
    <Menu
      onClick={handleClick}
      selectedKeys={[current]}
      mode="horizontal"
      items={subItems}
    />
  );
};

export default Index;
