import Link from "@mui/material/Link";
import { DOCS } from "@/constant";
import { OAuth2Error } from "@/shared/error";

interface Props {
  error: OAuth2Error;
}

export function SigninErrorMessage({ error }: Props) {
  switch (error.code) {
    case "unknown_guild":
      return (
        <>
          サーバーに参加していません（
          <Link href={`${DOCS}/signin.md`} target="_blank">
            マニュアル
          </Link>
          ）
        </>
      );
    default:
      return <>サインインに失敗しました</>;
  }
}
