import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Loader2, Eye, EyeOff, Info, X } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const validationSchema = Yup.object({
    studentId: Yup.string()
      .matches(/^202\d{6}$/, "Institutional ID must start with 202 and be 9 digits")
      .required("Institutional ID is required"),
    password: Yup.string().required("Password is required"),
  });

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 font-poppins bg-[radial-gradient(at_0%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(at_100%_100%,rgba(99,102,241,0.10),transparent_65%)] bg-slate-50">

      <Formik
        initialValues={{ studentId: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setStatus }) => {
          setStatus(null);
          try {
            const loggedInUser = await login(values);
            if (loggedInUser?.user?.role === "admin") {
              navigate("/dashboard/admin");
            } else {
              navigate("/dashboard/voter");
            }
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
            setStatus(errorMsg);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, handleChange, handleBlur, isSubmitting, status, errors, touched }) => (
          <Form className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 p-10">

            <div className="flex justify-center">
              <img src="/cics.png" alt="MSU Logo" className="h-24 w-24 object-contain" />
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
                MSU CICS Election Day
              </h2>
              <h1 className="text-3xl mt-4 font-bold tracking-tight text-slate-800">
                Enter your credentials
              </h1>
              <p className="text-sm text-slate-500 mt-2">Please enter your details to sign in.</p>
            </div>

            <div className="space-y-2 mb-5">
              <label htmlFor="studentId" className="text-sm font-semibold text-slate-700 ml-1">
                Institutional ID
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                placeholder="202XXXXXX"
                value={values.studentId}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`h-14 w-full border px-5 text-[1rem] rounded-2xl transition-all duration-200 outline-none font-medium ${errors.studentId && touched.studentId
                    ? "border-red-300 bg-red-50/30 ring-4 ring-red-50"
                    : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"
                  }`}
              />
              <ErrorMessage name="studentId" component="p" className="text-xs text-red-500 font-medium ml-1" />
            </div>

            <div className="space-y-2 mb-4">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`h-14 w-full border px-5 pr-12 text-[1rem] rounded-2xl transition-all duration-200 outline-none font-medium ${errors.password && touched.password
                      ? "border-red-300 bg-red-50/30 ring-4 ring-red-50"
                      : "border-slate-200 bg-slate-50/50 focus:border-[#2f318d] focus:ring-4 focus:ring-indigo-50"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2f318d] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <ErrorMessage name="password" component="p" className="text-xs text-red-500 font-medium ml-1" />
            </div>


            {status && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-sm font-medium text-red-600 text-center">{status}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-2xl bg-[#2f318d] text-[1rem] font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-[#26287a] hover:translate-y-0.5 active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </button>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs font-bold text-[#2f318d] hover:text-[#26287a] transition-colors flex items-center gap-1.5 py-1 px-2 hover:bg-indigo-50 rounded-lg"
              >
                <Info size={14} />
                Login Instructions
              </button>
            </div>
          </Form>
        )}
      </Formik>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md border border-slate-200 rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300 font-poppins">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800">Login Help</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-[#2f318d] flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Use your <span className="font-bold text-slate-800">Institutional ID</span> (e.g., 202XXXXXX).
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-[#2f318d] flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Password is your <span className="font-bold text-slate-800 underline decoration-indigo-200 underline-offset-4">firstname</span> in all lowercase letters.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                <p className="text-sm text-slate-600 leading-normal">
                  Still can't access? Visit the <span className="font-bold text-slate-800">BYTES Office</span> and look for <span className="text-[#2f318d] font-bold">Abdul-khaliq Solaiman</span> to verify your account.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-8 h-14 bg-[#2f318d] text-white rounded-2xl font-bold hover:bg-[#26287a] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}