# Realtek 8821CU Wi-Fi Recovery (Debian 12)

## Problem

After a kernel update (`6.1.0-48-amd64`), Wi-Fi disappeared completely.

Symptoms:
- No `wlx...` / `wlan0` interface in `ip a`
- USB adapter still visible in `lsusb`
- `modprobe 8821cu` produced:

```text
Exec format error
8821cu: disagrees about version of symbol module_layout
```

Cause:
- Old/outdated 8821cu module compiled for previous kernel
- Multiple old kernel/module remnants (35/47/48)
- DKMS inconsistency after kernel update

---

## Hardware

USB Wi-Fi adapter:

```text
Realtek 0bda:c811
RTL8821CU
```

---

## Working Solution

### 1. Download newer driver

Source:

https://github.com/morrownr/8821cu-20210916

Download ZIP:
- Code → Download ZIP

Transfer ZIP to Linux machine.

---

## 2. Install required packages

```bash
sudo apt update
sudo apt install dkms build-essential linux-headers-$(uname -r)
```

---

## 3. Remove broken old DKMS/module state

Check current DKMS:

```bash
sudo dkms status
```

Remove old module:

```bash
sudo dkms remove 8821cu/5.12.0.4 --all
```

Delete old installed modules:

```bash
sudo find /lib/modules/$(uname -r) -name '*8821cu*' -delete
```

Rebuild module database:

```bash
sudo depmod -a
sudo update-initramfs -u
```

---

## 4. Install fresh driver

Unpack ZIP:

```bash
cd ~/Desktop
unzip 8821cu-20210916-main.zip
cd 8821cu-20210916-main
```

Install:

```bash
sudo bash dkms-install.sh
```

Expected result:

```text
8821cu/5.12.0.4, 6.1.0-48-amd64, x86_64: installed
```

WITHOUT:

```text
WARNING! Diff between built and installed module!
```

---

## 5. Load module manually

```bash
sudo modprobe 8821cu
```

Check:

```bash
ip a
```

Expected:
- `wlx...`
or
- `wlan0`

appears.

---

## 6. Enable automatic loading at boot

```bash
echo 8821cu | sudo tee /etc/modules-load.d/8821cu.conf
```

Rebuild initramfs:

```bash
sudo update-initramfs -u
```

Verify:

```bash
cat /etc/modules-load.d/8821cu.conf
```

Expected:

```text
8821cu
```

---

## 7. Recommended: freeze kernel updates temporarily

Until system stability is confirmed:

```bash
sudo apt-mark hold linux-image-amd64 linux-headers-amd64
```

---

## Useful diagnostics

Kernel version:

```bash
uname -r
```

USB adapter detection:

```bash
lsusb
```

Network interfaces:

```bash
ip a
```

Kernel messages:

```bash
sudo dmesg | tail -50
```

DKMS status:

```bash
sudo dkms status
```

---

## Notes

The message:

```text
Deprecated feature: REMAKE_INITRD
```

is harmless and not related to failure.

The important thing is that DKMS reports the module as installed cleanly.

---

## Recommendation for future hardware

For Linux stability, prefer:
- Intel AX200 / AX210
- MediaTek chipsets

Realtek USB adapters often require manual DKMS maintenance after kernel updates.