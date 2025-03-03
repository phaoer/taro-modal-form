import { Button, Form, Text, View, type FormProps } from "@tarojs/components";
import { ENV_TYPE, getEnv, pxTransform } from "@tarojs/taro";
import React, { cloneElement, isValidElement, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type RuleItem = {
	name: string;
	required?: boolean;
	message?: string;
	error?: boolean;
};

type ModalFormItemProps = {
	name: string;
	children: React.ReactNode;
	rule?: RuleItem;
};

const ModalFormItem: React.FC<ModalFormItemProps> = ({ name, children, rule }) => {
	const titleStyle: React.CSSProperties = {
		display: "flex",
		alignItems: "center",
		gap: 4,
		marginBottom: pxTransform(12),
		fontSize: 14,
		color: "#44474e",
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
	};

	const errorStyle: React.CSSProperties = {
		fontSize: 12,
		color: "red",
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
	};

	return (
		<View
			style={{
				marginBottom: pxTransform(12),
			}}
		>
			<View style={titleStyle}>
				{rule?.required && (
					<Text
						style={{
							color: "red",
						}}
					>
						*
					</Text>
				)}
				{name}
			</View>

			<View
				style={{
					marginBottom: pxTransform(5),
				}}
			>
				{isValidElement(children)
					? cloneElement(children as React.ReactElement<{ name: string }>, {
							name: name,
						})
					: null}
			</View>

			{rule?.required && rule?.error && <View style={errorStyle}>{rule?.message ?? `请输入${name}`}</View>}
		</View>
	);
};

export { ModalFormItem };

type ModalFormProps = {
	trigger?: React.ReactNode;
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (isOpen: boolean) => void;
	title?: string;
	width?: number;
	zIndex?: number;
	onFinish?: (values: Record<string, any>) => Promise<boolean>;
	formProps?: Omit<FormProps, "onSubmit" | "onReset">;
	cancelBtnText?: string;
	finishBtnText?: string;
	footer?: React.ReactNode;
	rules?: RuleItem[];
};

const ModalForm: React.FC<ModalFormProps> = ({
	title,
	open,
	trigger,
	children,
	width = 600,
	zIndex = 1,
	formProps,
	cancelBtnText = "取消",
	finishBtnText = "确定",
	footer,
	...rest
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [rules, setRules] = useState(rest.rules ?? []);

	useEffect(() => {
		if (open !== undefined) {
			setIsOpen(open);
		}
	}, [open]);

	useEffect(() => {
		rest?.onOpenChange?.(isOpen);
	}, [isOpen]);

	const formSubmit = async (e) => {
		try {
			const formValues = e?.detail?.value ?? {};
			const ruleUnPassCheckedItem = rules.filter((ele) => {
				if (!ele.required) {
					return false;
				}

				const value = formValues[ele.name];

				if (Array.isArray(value)) {
					return value.length === 0;
				}

				if (value !== null && typeof value === "object") {
					return Object.keys(value).length === 0;
				}

				if (typeof value === "boolean") {
					return false;
				}

				return !value && value !== 0;
			});

			setRules((prev) =>
				[...prev].map((ele) => {
					if (ruleUnPassCheckedItem.find((item) => item.name === ele.name)) {
						return {
							...ele,
							error: true,
						};
					}

					return {
						...ele,
						error: false,
					};
				}),
			);

			if (ruleUnPassCheckedItem.length !== 0) return;

			const res = await rest?.onFinish?.(e);

			if (res === true) {
				setIsOpen(false);
			}
		} catch (error) {}
	};

	const formReset = (e) => {};

	const wrapperStyle: React.CSSProperties = {
		boxSizing: "border-box",
		position: "fixed",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		zIndex,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
	};

	const headerStyle: React.CSSProperties = {
		boxSizing: "border-box",
		fontSize: pxTransform(35),
		marginBottom: pxTransform(16),
		color: "#000",
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
	};

	const contentStyle: React.CSSProperties = {
		boxSizing: "border-box",
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		width: pxTransform(width),
		borderRadius: pxTransform(6),
		backgroundColor: "#fff",
		padding: pxTransform(40),
		overflow: "hidden",
	};

	const bodyStyle: React.CSSProperties = {
		boxSizing: "border-box",
		paddingBottom: pxTransform(40),
	};

	const footerStyle: React.CSSProperties = {
		boxSizing: "border-box",
		textAlign: "right",
		fontSize: 0,
	};

	const footerCancelBtnStyle: React.CSSProperties = {
		margin: 0,
	};

	const footerConfirmBtnStyle: React.CSSProperties = {
		...footerCancelBtnStyle,
		margin: `0 0 0 ${pxTransform(24)}`,
	};

	const modalFormContent = (
		<View style={wrapperStyle}>
			<View style={contentStyle}>
				{title && <View style={headerStyle}>{title}</View>}

				<Form onSubmit={formSubmit} onReset={formReset} {...formProps}>
					<View style={bodyStyle}>
						{React.Children.toArray(children).map((ele) => {
							if (isValidElement(ele) && ele.type === ModalFormItem) {
								return cloneElement(ele as React.ReactElement<{ rule: RuleItem }>, {
									rule: rules.find((item) => item.name === ele.props.name),
								});
							}

							return (
								<View
									style={{
										marginBottom: pxTransform(5),
									}}
								>
									{ele}
								</View>
							);
						})}
					</View>

					{footer ?? (
						<View style={footerStyle}>
							<Button
								size="mini"
								style={footerCancelBtnStyle}
								onClick={() => {
									setIsOpen(false);
								}}
							>
								{cancelBtnText}
							</Button>
							<Button type="primary" size="mini" style={footerConfirmBtnStyle} formType="submit">
								{finishBtnText}
							</Button>
						</View>
					)}
				</Form>
			</View>
		</View>
	);

	return (
		<>
			{isOpen && (getEnv() === ENV_TYPE.WEB ? createPortal(modalFormContent, document.body) : modalFormContent)}

			{isValidElement(trigger)
				? open === undefined
					? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
							onClick: () => {
								setIsOpen(true);
							},
						})
					: trigger
				: null}
		</>
	);
};

export default ModalForm;
