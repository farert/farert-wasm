<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M5 16V9h14V2H5l14 14h-7m-7 0 7 7v-7m-7 0h7" }]];
</script>

<Icon name="framer" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
